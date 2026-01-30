<template>
  <div class="sandbox">
    <el-container>
      <!-- Header -->
      <el-header class="sandbox-header">
        <div class="header-left">
          <el-button text @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h1 class="project-name">{{ project?.name }}</h1>
        </div>
        <div class="header-right">
          <el-button :loading="sandboxLoading" @click="startSandbox">
            <el-icon><VideoPlay /></el-icon>
            {{ sandbox ? 'Running' : 'Start' }}
          </el-button>
          <el-button @click="saveFile" :disabled="!currentFile">
            <el-icon><DocumentCopy /></el-icon>
            Save
          </el-button>
        </div>
      </el-header>

      <!-- Main Content -->
      <el-container class="sandbox-main">
        <!-- File Tree Sidebar -->
        <el-aside width="250px" class="file-tree-sidebar">
          <div class="sidebar-header">
            <span>Files</span>
          </div>
          <el-tree
            :data="fileTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="path"
            @node-click="handleFileClick"
            class="file-tree"
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <el-icon v-if="data.type === 'directory'"><Folder /></el-icon>
                <el-icon v-else><Document /></el-icon>
                <span>{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </el-aside>

        <!-- Editor and Terminal -->
        <el-container>
          <el-main class="editor-container">
            <div v-if="!currentFile" class="empty-editor">
              <el-empty description="Select a file to edit" />
            </div>
            <div v-else class="editor-wrapper">
              <div class="editor-header">
                <span class="file-path">{{ currentFile }}</span>
              </div>
              <div ref="editorRef" class="monaco-editor"></div>
            </div>
          </el-main>

          <!-- Terminal -->
          <div class="terminal-container">
            <div class="terminal-header">
              <span>Terminal</span>
              <div class="terminal-actions">
                <el-button text size="small" @click="clearTerminal">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div ref="terminalRef" class="terminal"></div>
          </div>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, VideoPlay, DocumentCopy, Folder, Document, Delete } from '@element-plus/icons-vue'
import type { Project, FileNode } from '@code-play/shared'
import { projectApi } from '../../api/projects'
import { sandboxApi, type Sandbox } from '../../api/sandboxes'
import { opfs } from '../../utils/opfs'
import { db } from '../../db'
import { useMonacoEditor, getLanguageFromFilename } from '../../composables/useMonaco'
import { useTerminal } from '../../composables/useTerminal'

const router = useRouter()
const route = useRoute()

const project = ref<Project | null>(null)
const sandbox = ref<Sandbox | null>(null)
const sandboxLoading = ref(false)
const fileTree = ref<FileNode[]>([])
const currentFile = ref<string>('')

const editorRef = ref<HTMLElement | null>(null)
const terminalRef = ref<HTMLElement | null>(null)

const { setContent, getContent, setLanguage } = useMonacoEditor(editorRef)
const { connect, disconnect, clear: clearTerminal } = useTerminal(terminalRef)

onMounted(async () => {
  const projectId = route.params.id as string
  await loadProject(projectId)
  await loadFiles(projectId)
})

async function loadProject(projectId: string) {
  try {
    // Try to load from local database first
    const localProject = await db.projects.get(projectId)
    if (localProject) {
      project.value = localProject
    }

    // Then fetch from API
    const apiProject = await projectApi.getProject(projectId)
    project.value = apiProject
  } catch (error) {
    console.error('Failed to load project:', error)
    ElMessage.error('Failed to load project')
    router.push('/dashboard')
  }
}

async function loadFiles(projectId: string) {
  try {
    const files = await opfs.listFiles(projectId)
    fileTree.value = files
  } catch (error) {
    console.error('Failed to load files:', error)
    ElMessage.error('Failed to load files')
  }
}

async function handleFileClick(file: FileNode) {
  if (file.type === 'directory') {
    return
  }

  try {
    currentFile.value = file.path
    const content = await opfs.readFile(project.value!.id, file.path)
    const language = getLanguageFromFilename(file.name)
    setContent(content, language)
  } catch (error) {
    console.error('Failed to read file:', error)
    ElMessage.error('Failed to read file')
  }
}

async function saveFile() {
  if (!currentFile.value || !project.value) {
    return
  }

  try {
    const content = getContent()
    await opfs.writeFile(project.value.id, currentFile.value, content)
    ElMessage.success('File saved')
  } catch (error) {
    console.error('Failed to save file:', error)
    ElMessage.error('Failed to save file')
  }
}

async function startSandbox() {
  if (!project.value) {
    return
  }

  if (sandbox.value) {
    ElMessage.info('Sandbox is already running')
    return
  }

  try {
    sandboxLoading.value = true
    const newSandbox = await sandboxApi.createSandbox({
      projectId: project.value.id,
    })
    sandbox.value = newSandbox

    // Connect terminal to sandbox
    const token = localStorage.getItem('auth_token')
    const wsUrl = `${sandboxApi.getTerminalWsUrl(newSandbox.id)}?token=${token}`
    connect(wsUrl)

    ElMessage.success('Sandbox started')
  } catch (error) {
    console.error('Failed to start sandbox:', error)
    ElMessage.error('Failed to start sandbox')
  } finally {
    sandboxLoading.value = false
  }
}

function goBack() {
  router.push('/dashboard')
}
</script>

<style scoped>
.sandbox {
  height: 100vh;
  overflow: hidden;
}

.sandbox-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sandbox-main {
  height: calc(100vh - 60px);
}

.file-tree-sidebar {
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.sidebar-header {
  padding: 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e4e7ed;
}

.file-tree {
  background: transparent;
  padding: 8px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.editor-container {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 60%;
}

.empty-editor {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  padding: 8px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px;
  color: #666;
}

.monaco-editor {
  flex: 1;
  height: 100%;
}

.terminal-container {
  height: 40%;
  border-top: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.terminal-header {
  padding: 8px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.terminal-actions {
  display: flex;
  gap: 4px;
}

.terminal {
  flex: 1;
  padding: 8px;
  background: #1e1e1e;
  overflow: hidden;
}
</style>
