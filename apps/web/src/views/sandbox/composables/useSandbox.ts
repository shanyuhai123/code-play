import type { FileNode, ProjectSummary } from '@code-play/domain'
import type { Ref } from 'vue'
import type { GetProjectResponse } from '@/apis/project'
import type { MonacoFile } from '@/components/monaco-editor/types'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getProject, syncProjectFile } from '@/apis/project'
import { startSandboxSession } from '@/apis/sandbox'
import { getLanguageFromFilename } from '@/components/monaco-editor'
import { db } from '@/utils/db'
import { opfs } from '@/utils/opfs'

function normalizeProject(project: ProjectSummary): ProjectSummary {
  return {
    ...project,
    activeSessionId: project.activeSessionId ?? null,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
    userId: project.userId ?? null,
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useSandbox(projectId: Ref<string>) {
  const router = useRouter()

  const project = ref<ProjectSummary | null>(null)
  const fileTree = ref<FileNode[]>([])
  const currentFile = ref('')
  const currentFileContent = ref('')
  const loadedFileContent = ref('')
  const booting = ref(true)
  const bootMessage = ref('正在初始化项目...')
  const previewUrl = ref<string | null>(null)

  const isReady = computed(() => project.value?.status === 'ready')
  const isDirty = computed(() => !!currentFile.value && currentFileContent.value !== loadedFileContent.value)
  const currentFileName = computed(() => currentFile.value.split('/').pop() || '')
  const currentLanguage = computed(() => getLanguageFromFilename(currentFileName.value))
  const editorFiles = computed<MonacoFile[]>(() => {
    const files: MonacoFile[] = []

    function visit(nodes: FileNode[]) {
      for (const node of nodes) {
        if (node.type === 'file') {
          files.push({
            path: node.path,
            content: node.content ?? '',
          })
          continue
        }

        if (node.children) {
          visit(node.children)
        }
      }
    }

    visit(fileTree.value)
    return files
  })

  let syncTimer: ReturnType<typeof setTimeout> | null = null
  let bootstrapId = 0
  let opfsReady = false
  let hydratingFile = false

  function patchFileTree(nodes: FileNode[], path: string, content: string): FileNode[] {
    return nodes.map((node) => {
      if (node.path === path && node.type === 'file') {
        return {
          ...node,
          content,
        }
      }

      if (node.type === 'directory' && node.children) {
        return {
          ...node,
          children: patchFileTree(node.children, path, content),
        }
      }

      return node
    })
  }

  function updateFileTreeContent(path: string, content: string) {
    fileTree.value = patchFileTree(fileTree.value, path, content)
  }

  function resetState() {
    project.value = null
    fileTree.value = []
    currentFile.value = ''
    currentFileContent.value = ''
    loadedFileContent.value = ''
    booting.value = true
    bootMessage.value = '正在初始化项目...'
    previewUrl.value = null
    clearSyncTimer()
  }

  function clearSyncTimer() {
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
  }

  function isActive(id: number) {
    return id === bootstrapId
  }

  async function bootstrapProject(id: string, currentBootstrapId: number) {
    try {
      const remote = await waitForProjectReady(id, currentBootstrapId)
      if (!remote || !isActive(currentBootstrapId) || !isReady.value) {
        return
      }

      fileTree.value = remote.files

      // 启动沙盒会话并获取预览 URL
      try {
        const result = await startSandboxSession(id)
        if (isActive(currentBootstrapId)) {
          previewUrl.value = result.previewUrl
        }
      }
      catch (error) {
        console.error('启动沙盒会话失败:', error)
      }
    }
    finally {
      if (isActive(currentBootstrapId)) {
        booting.value = false
      }
    }
  }

  async function waitForProjectReady(id: string, currentBootstrapId: number): Promise<GetProjectResponse | null> {
    while (isActive(currentBootstrapId)) {
      const remote = await loadProject(id, currentBootstrapId)
      if (!remote || !project.value || !isActive(currentBootstrapId)) {
        return null
      }

      if (project.value.status === 'failed') {
        bootMessage.value = project.value.errorMessage || '项目初始化失败'
        ElMessage.error(bootMessage.value)
        return remote
      }

      if (project.value.status === 'ready') {
        bootMessage.value = '项目已就绪'
        await loadFiles(id, currentBootstrapId)
        return remote
      }

      bootMessage.value = '正在创建模板并准备沙盒...'
      await sleep(1500)
    }

    return null
  }

  async function loadProject(id: string, currentBootstrapId: number) {
    try {
      const remote = await getProject(id)
      if (!isActive(currentBootstrapId)) {
        return null
      }

      project.value = normalizeProject(remote.project)
      await cacheProject(project.value)
      await cacheProjectFiles(id, remote.files)
      return remote
    }
    catch (error) {
      if (isActive(currentBootstrapId)) {
        console.error('加载项目失败:', error)
        ElMessage.error('加载项目失败')
        router.push('/dashboard')
      }
      return null
    }
  }

  async function loadFiles(id: string, currentBootstrapId: number) {
    try {
      const localFiles = await opfs.listFiles(id)
      if (!isActive(currentBootstrapId)) {
        return
      }

      if (localFiles.length > 0 && isReady.value) {
        fileTree.value = localFiles
        return
      }

      const remote = await getProject(id)
      if (!isActive(currentBootstrapId)) {
        return
      }

      await cacheProjectFiles(id, remote.files)
      fileTree.value = remote.files
    }
    catch (error) {
      if (isActive(currentBootstrapId)) {
        console.error('加载文件失败:', error)
        ElMessage.error('加载文件失败')
      }
    }
  }

  async function openFile(file: FileNode) {
    if (file.type === 'directory' || !project.value || !isReady.value) {
      return
    }

    try {
      clearSyncTimer()

      if (isDirty.value) {
        await persistCurrentFile(true)
      }

      const content = await opfs.readFile(project.value.id, file.path)

      hydratingFile = true
      currentFile.value = file.path
      loadedFileContent.value = content
      currentFileContent.value = content
      updateFileTreeContent(file.path, content)
    }
    catch (error) {
      console.error('读取文件失败:', error)
      ElMessage.error('读取文件失败')
    }
    finally {
      hydratingFile = false
    }
  }

  async function openFileByPath(path: string) {
    const normalizedPath = path.replace(/^\/+/, '')

    async function findFile(nodes: FileNode[]): Promise<FileNode | null> {
      for (const node of nodes) {
        if (node.type === 'file' && node.path === normalizedPath) {
          return node
        }

        if (node.type === 'directory' && node.children) {
          const matched = await findFile(node.children)
          if (matched) {
            return matched
          }
        }
      }

      return null
    }

    const target = await findFile(fileTree.value)
    if (!target) {
      ElMessage.warning(`未找到文件: ${normalizedPath}`)
      return
    }

    await openFile(target)
  }

  async function saveCurrentFile() {
    if (!project.value || !currentFile.value || !isReady.value) {
      return
    }

    try {
      await persistCurrentFile(true)
      ElMessage.success('保存成功')
    }
    catch (error) {
      console.error('保存文件失败:', error)
      ElMessage.error('保存文件失败')
    }
  }

  async function persistCurrentFile(immediate = false) {
    if (!project.value || !currentFile.value || !isReady.value) {
      return
    }

    const content = currentFileContent.value

    await opfs.writeFile(project.value.id, currentFile.value, content)

    if (content === loadedFileContent.value && !immediate) {
      return
    }

    await syncProjectFile(project.value.id, {
      content,
      path: currentFile.value,
    })

    loadedFileContent.value = content
    updateFileTreeContent(currentFile.value, content)
  }

  async function cacheProject(projectToCache: ProjectSummary) {
    try {
      await db.projects.put({
        ...projectToCache,
        createdAt: new Date(projectToCache.createdAt),
        updatedAt: new Date(projectToCache.updatedAt),
      })
    }
    catch (error) {
      console.error('缓存项目失败:', error)
    }
  }

  async function cacheProjectFiles(id: string, files: FileNode[]) {
    if (files.length === 0) {
      return
    }

    try {
      await opfs.writeFiles(id, files)
    }
    catch (error) {
      console.error('缓存文件失败:', error)
    }
  }

  watch(projectId, async (id) => {
    bootstrapId += 1
    const currentBootstrapId = bootstrapId

    resetState()

    if (!id) {
      bootMessage.value = '项目不存在'
      booting.value = false
      return
    }

    if (!opfsReady) {
      await opfs.init()
      opfsReady = true
    }

    if (!isActive(currentBootstrapId)) {
      return
    }

    await bootstrapProject(id, currentBootstrapId)
  }, { immediate: true })

  watch(currentFileContent, (content) => {
    if (!project.value || !currentFile.value || !isReady.value || hydratingFile || content === loadedFileContent.value) {
      return
    }

    clearSyncTimer()
    syncTimer = setTimeout(async () => {
      try {
        await persistCurrentFile()
      }
      catch (error) {
        console.error('同步文件失败:', error)
      }
    }, 800)
  })

  onUnmounted(() => {
    bootstrapId += 1
    clearSyncTimer()
  })

  return {
    booting,
    bootMessage,
    currentFile,
    currentFileContent,
    currentFileName,
    currentLanguage,
    editorFiles,
    fileTree,
    isDirty,
    isReady,
    openFile,
    openFileByPath,
    previewUrl,
    project,
    saveCurrentFile,
  }
}
