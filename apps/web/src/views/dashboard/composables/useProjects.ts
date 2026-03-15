import type { Project, ProjectSummary } from '@code-play/domain'
import { onMounted, ref } from 'vue'
import { createProject as apiCreateProject, deleteProject as apiDeleteProject, renameProject as apiRenameProject, listProjects } from '@/apis/project'
import { db } from '@/utils/db'
import { opfs } from '@/utils/opfs'

function normalizeProject(project: ProjectSummary | Project): ProjectSummary {
  return {
    ...project,
    userId: project.userId ?? null,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
    activeSessionId: 'activeSessionId' in project ? project.activeSessionId ?? null : null,
  }
}

const loading = ref(false)
const refreshing = ref(false)
const creating = ref(false)
const projects = ref<ProjectSummary[]>([])
const cacheHydrated = ref(false)
const opfsReady = ref(false)

export function useProjects() {
  async function hydrateProjectsFromCache() {
    if (cacheHydrated.value) {
      return
    }

    try {
      projects.value = await db.projects.orderBy('updatedAt').reverse().toArray()
      cacheHydrated.value = true
    }
    catch (error) {
      console.error('读取本地项目缓存失败:', error)
    }
  }

  async function loadProjects() {
    if (loading.value || refreshing.value) {
      return
    }

    const showBlockingLoader = projects.value.length === 0

    try {
      if (showBlockingLoader) {
        loading.value = true
      }
      else {
        refreshing.value = true
      }

      const remoteProjects = await listProjects()
      const normalized = remoteProjects.map(normalizeProject)
      await cacheProjects(normalized)
      projects.value = normalized
    }
    catch (error) {
      console.error('加载项目失败:', error)
      await hydrateProjectsFromCache()
      if (projects.value.length === 0) {
        ElMessage.error('加载项目失败')
      }
    }
    finally {
      loading.value = false
      refreshing.value = false
    }
  }

  async function createProject(name: string, templateId: string) {
    try {
      creating.value = true
      const result = await apiCreateProject({ name, templateId })
      const normalizedProject = normalizeProject(result.project)
      await cacheProject(normalizedProject)
      await loadProjects()
      return result
    }
    finally {
      creating.value = false
    }
  }

  async function renameProject(id: string, name: string) {
    const updated = normalizeProject(await apiRenameProject(id, { name }))
    await cacheProject(updated)
    await loadProjects()
  }

  async function deleteProject(project: ProjectSummary | Project) {
    await ElMessageBox.confirm(
      `确定删除项目「${project.name}」吗？此操作不可恢复。`,
      '删除项目',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )

    await apiDeleteProject(project.id)
    projects.value = projects.value.filter(item => item.id !== project.id)

    const cleanupResults = await Promise.allSettled([
      opfs.deleteProject(project.id),
      db.projects.delete(project.id),
    ])

    cleanupResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        const target = index === 0 ? 'OPFS' : 'IndexedDB'
        console.error(`删除项目本地缓存失败 (${target}):`, result.reason)
      }
    })

    await loadProjects()
  }

  onMounted(async () => {
    if (!opfsReady.value) {
      await opfs.init()
      opfsReady.value = true
    }

    await hydrateProjectsFromCache()
    await loadProjects()
  })

  async function cacheProject(project: ProjectSummary) {
    try {
      await db.projects.put(project)
    }
    catch (error) {
      console.error('缓存项目失败:', error)
    }
  }

  async function cacheProjects(projects: ProjectSummary[]) {
    try {
      await db.projects.bulkPut(projects)
    }
    catch (error) {
      console.error('缓存项目列表失败:', error)
    }
  }

  return {
    creating,
    loading,
    refreshing,
    projects,
    createProject,
    renameProject,
    deleteProject,
  }
}
