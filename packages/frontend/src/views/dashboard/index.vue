<template>
  <div class="dashboard">
    <el-container>
      <!-- Header -->
      <el-header class="dashboard-header">
        <div class="header-left">
          <h1 class="logo">Code Play</h1>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :src="user?.avatarUrl" :size="32">
                {{ user?.username?.[0]?.toUpperCase() }}
              </el-avatar>
              <span class="username">{{ user?.username }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  Logout
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Main Content -->
      <el-main class="dashboard-main">
        <div class="dashboard-content">
          <!-- Header Actions -->
          <div class="content-header">
            <h2>My Projects</h2>
            <el-button type="primary" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>
              New Project
            </el-button>
          </div>

          <!-- Projects Grid -->
          <div v-loading="loading" class="projects-grid">
            <el-empty v-if="!loading && projects.length === 0" description="No projects yet">
              <el-button type="primary" @click="showCreateDialog = true">
                Create Your First Project
              </el-button>
            </el-empty>

            <div v-else class="project-cards">
              <el-card
                v-for="project in projects"
                :key="project.id"
                class="project-card"
                shadow="hover"
                @click="openProject(project.id)"
              >
                <div class="project-icon">
                  <el-icon :size="40"><Document /></el-icon>
                </div>
                <div class="project-info">
                  <h3 class="project-name">{{ project.name }}</h3>
                  <p class="project-template">{{ getTemplateName(project.templateId) }}</p>
                  <p class="project-date">{{ formatDate(project.updatedAt) }}</p>
                </div>
                <div class="project-actions" @click.stop>
                  <el-dropdown @command="(cmd) => handleProjectCommand(cmd, project)">
                    <el-button text circle>
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="rename">
                          <el-icon><Edit /></el-icon>
                          Rename
                        </el-dropdown-item>
                        <el-dropdown-item command="delete" divided>
                          <el-icon><Delete /></el-icon>
                          Delete
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </el-card>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>

    <!-- Create Project Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      title="Create New Project"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="Project Name" required>
          <el-input
            v-model="createForm.name"
            placeholder="my-awesome-project"
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="Template" required>
          <el-select v-model="createForm.templateId" placeholder="Select a template" style="width: 100%">
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            >
              <div class="template-option">
                <span>{{ template.name }}</span>
                <span class="template-desc">{{ template.description }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button
          type="primary"
          :loading="creating"
          :disabled="!createForm.name || !createForm.templateId"
          @click="handleCreateProject"
        >
          Create
        </el-button>
      </template>
    </el-dialog>

    <!-- Rename Project Dialog -->
    <el-dialog
      v-model="showRenameDialog"
      title="Rename Project"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="renameForm.name"
        placeholder="Enter new name"
        maxlength="50"
      />
      <template #footer>
        <el-button @click="showRenameDialog = false">Cancel</el-button>
        <el-button
          type="primary"
          :loading="renaming"
          :disabled="!renameForm.name"
          @click="handleRenameProject"
        >
          Rename
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, Edit, Delete, MoreFilled, SwitchButton } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { Project } from '@code-play/shared'
import { useAuth } from '../../composables/useAuth'
import { projectApi } from '../../api/projects'
import { db } from '../../db'
import { opfs } from '../../utils/opfs'

dayjs.extend(relativeTime)

const router = useRouter()
const { user, logout } = useAuth()

const loading = ref(false)
const creating = ref(false)
const renaming = ref(false)
const projects = ref<Project[]>([])
const showCreateDialog = ref(false)
const showRenameDialog = ref(false)

const createForm = ref({
  name: '',
  templateId: '',
})

const renameForm = ref({
  id: '',
  name: '',
})

const templates = [
  { id: 'vanilla', name: 'Vanilla', description: 'Vanilla JavaScript with TypeScript' },
  { id: 'vue', name: 'Vue', description: 'Vue 3 + TypeScript' },
  { id: 'react', name: 'React', description: 'React + TypeScript' },
  { id: 'preact', name: 'Preact', description: 'Preact + TypeScript' },
  { id: 'lit', name: 'Lit', description: 'Lit + TypeScript' },
  { id: 'svelte', name: 'Svelte', description: 'Svelte + TypeScript' },
  { id: 'solid', name: 'Solid', description: 'Solid + TypeScript' },
  { id: 'qwik', name: 'Qwik', description: 'Qwik + TypeScript' },
]

onMounted(async () => {
  await loadProjects()
  await opfs.init()
})

async function loadProjects() {
  try {
    loading.value = true
    const data = await projectApi.getProjects()
    projects.value = data

    // Sync with local database
    for (const project of data) {
      await db.projects.put(project)
    }
  } catch (error) {
    console.error('Failed to load projects:', error)
    ElMessage.error('Failed to load projects')
  } finally {
    loading.value = false
  }
}

async function handleCreateProject() {
  if (!createForm.value.name || !createForm.value.templateId) {
    return
  }

  try {
    creating.value = true
    const result = await projectApi.createProject({
      name: createForm.value.name,
      templateId: createForm.value.templateId,
    })

    // Save to local database
    await db.projects.put(result.project)

    // Save files to OPFS
    if (result.files && result.files.length > 0) {
      await opfs.writeFiles(result.project.id, result.files)
    }

    ElMessage.success('Project created successfully')
    showCreateDialog.value = false
    createForm.value = { name: '', templateId: '' }
    await loadProjects()
  } catch (error) {
    console.error('Failed to create project:', error)
    ElMessage.error('Failed to create project')
  } finally {
    creating.value = false
  }
}

function openProject(id: string) {
  router.push(`/sandbox/${id}`)
}

function handleProjectCommand(command: string, project: Project) {
  if (command === 'rename') {
    renameForm.value = {
      id: project.id,
      name: project.name,
    }
    showRenameDialog.value = true
  } else if (command === 'delete') {
    handleDeleteProject(project)
  }
}

async function handleRenameProject() {
  if (!renameForm.value.name) {
    return
  }

  try {
    renaming.value = true
    await projectApi.updateProject(renameForm.value.id, {
      name: renameForm.value.name,
    })

    ElMessage.success('Project renamed successfully')
    showRenameDialog.value = false
    await loadProjects()
  } catch (error) {
    console.error('Failed to rename project:', error)
    ElMessage.error('Failed to rename project')
  } finally {
    renaming.value = false
  }
}

async function handleDeleteProject(project: Project) {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      'Delete Project',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )

    await projectApi.deleteProject(project.id)
    await db.projects.delete(project.id)
    await opfs.deleteProject(project.id)

    ElMessage.success('Project deleted successfully')
    await loadProjects()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete project:', error)
      ElMessage.error('Failed to delete project')
    }
  }
}

function handleUserCommand(command: string) {
  if (command === 'logout') {
    logout()
    router.push('/login')
  }
}

function getTemplateName(templateId: string) {
  return templates.find(t => t.id === templateId)?.name || templateId
}

function formatDate(date: Date) {
  return dayjs(date).fromNow()
}
</script>

<style scoped>
.dashboard {
  height: 100vh;
  background: #f5f7fa;
}

.dashboard-header {
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
}

.logo {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f5f7fa;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.dashboard-main {
  padding: 24px;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.content-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.projects-grid {
  min-height: 400px;
}

.project-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.project-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.project-card :deep(.el-card__body) {
  padding: 24px;
}

.project-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 16px;
}

.project-info {
  flex: 1;
}

.project-name {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-template {
  margin: 0 0 4px;
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
}

.project-date {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.project-actions {
  position: absolute;
  top: 16px;
  right: 16px;
}

.template-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.template-desc {
  font-size: 12px;
  color: #999;
}
</style>
