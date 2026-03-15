<script setup lang="ts">
import type { Project } from '@code-play/domain'
import type { ThemePreference } from '@/themes'
import { BrushFilled, Document, Plus } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import CreateProjectDialog from './components/CreateProjectDialog.vue'
import ProjectCard from './components/ProjectCard.vue'
import RenameProjectDialog from './components/RenameProjectDialog.vue'
import { useProjects } from './composables/useProjects'

const router = useRouter()
const { loading, refreshing, creating, projects, createProject, renameProject, deleteProject } = useProjects()
const { themePreference, themes } = useTheme()

const showCreateDialog = ref(false)
const showRenameDialog = ref(false)
const renamingProject = ref<Project | null>(null)

const currentThemeLabel = computed(() => {
  if (themePreference.value === 'system')
    return '跟随系统'
  return themes.find(t => t.id === themePreference.value)?.label ?? '跟随系统'
})

function openProject(id: string) {
  router.push({ name: 'sandbox', params: { id } })
}

async function handleCreated(name: string, templateId: string) {
  try {
    const result = await createProject(name, templateId)
    showCreateDialog.value = false
    ElMessage.success('项目已提交，正在初始化')
    router.push({ name: 'sandbox', params: { id: result.project.id } })
  }
  catch (error) {
    console.error('创建项目失败:', error)
    ElMessage.error('创建项目失败')
  }
}

function handleRenameRequest(project: Project) {
  renamingProject.value = project
  showRenameDialog.value = true
}

async function handleRenamed(id: string, name: string) {
  try {
    await renameProject(id, name)
  }
  catch (error) {
    console.error('重命名失败:', error)
    ElMessage.error('重命名失败')
  }
}

async function handleDelete(project: Project) {
  try {
    await deleteProject(project)
  }
  catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除项目失败:', error)
      ElMessage.error('删除项目失败')
    }
  }
}

function handleThemeCommand(theme: ThemePreference) {
  themePreference.value = theme
}
</script>

<template>
  <div class="dashboard-view h-screen flex flex-col bg-(--cp-page-bg) text-(--cp-text-primary)">
    <header
      class="h-14 flex shrink-0 items-center justify-between border-b border-(--cp-border) bg-(--cp-topbar-bg) px-6 text-(--cp-topbar-text) shadow-[0_10px_30px_color-mix(in_srgb,var(--cp-text-primary)_8%,transparent)]"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--cp-accent),var(--cp-accent-strong))]"
        >
          <span class="text-sm font-bold leading-none text-white">CP</span>
        </div>
        <span class="text-lg font-semibold tracking-tight">Code Play</span>
      </div>

      <el-dropdown @command="handleThemeCommand">
        <el-button
          text
          class="border-none [--el-button-bg-color:transparent] [--el-button-border-color:transparent] [--el-button-hover-bg-color:var(--cp-surface-muted)] [--el-button-hover-border-color:transparent] [--el-button-text-color:var(--cp-topbar-text)] [--el-button-hover-text-color:var(--cp-topbar-text)]"
        >
          <el-icon class="mr-2">
            <BrushFilled />
          </el-icon>
          {{ currentThemeLabel }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="system">
              <div class="flex flex-col gap-0.5">
                <span class="font-medium">跟随系统</span>
                <span class="text-xs text-(--cp-text-tertiary)">自动跟随系统明暗模式</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item
              v-for="theme in themes"
              :key="theme.id"
              :command="theme.id"
            >
              <div class="flex items-center gap-3">
                <span
                  class="inline-block h-4 w-6 shrink-0 rounded border border-(--cp-border)"
                  :style="{ background: theme.previewStyle }"
                />
                <div class="flex flex-col gap-0.5">
                  <span class="font-medium">{{ theme.label }}</span>
                  <span class="text-xs text-(--cp-text-tertiary)">{{ theme.description }}</span>
                </div>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <main class="flex-1 overflow-auto">
      <div class="mx-auto max-w-6xl px-8 py-12">
        <div class="mb-10">
          <h1 class="m-0 mb-2 text-3xl font-bold text-(--cp-text-primary)">
            欢迎回来
          </h1>
          <p class="m-0 mb-6 text-base text-(--cp-text-tertiary)">
            管理和创建你的代码沙盒项目
          </p>
          <div class="flex items-center gap-3">
            <el-button type="primary" size="large" @click="showCreateDialog = true">
              <el-icon class="mr-1">
                <Plus />
              </el-icon>
              新建项目
            </el-button>
            <el-tag v-if="refreshing" size="small" effect="plain" type="info">
              正在同步列表
            </el-tag>
          </div>
        </div>

        <div
          v-loading="loading && projects.length === 0"
          class="min-h-80 rounded-3xl border p-6 backdrop-blur-sm"
          :style="{
            borderColor: 'var(--cp-dashboard-panel-border)',
            background: 'var(--cp-dashboard-panel-bg)',
            boxShadow: 'var(--cp-dashboard-panel-shadow)',
          }"
        >
          <div v-if="!loading && projects.length === 0" class="flex flex-col items-center justify-center py-24">
            <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-(--cp-accent-soft)">
              <el-icon :size="48" class="text-(--cp-accent)">
                <Document />
              </el-icon>
            </div>
            <h3 class="m-0 mb-2 text-xl font-semibold text-(--cp-text-secondary)">
              还没有项目
            </h3>
            <p class="m-0 mb-8 text-sm text-(--cp-text-tertiary)">
              创建你的第一个项目，开始编码之旅
            </p>
            <el-button type="primary" size="large" @click="showCreateDialog = true">
              <el-icon class="mr-1">
                <Plus />
              </el-icon>
              创建第一个项目
            </el-button>
          </div>

          <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ProjectCard
              v-for="project in projects" :key="project.id" :project="project" @open="openProject"
              @rename="handleRenameRequest" @delete="handleDelete"
            />
          </div>
        </div>
      </div>
    </main>

    <CreateProjectDialog v-model="showCreateDialog" :loading="creating" @created="handleCreated" />
    <RenameProjectDialog v-model="showRenameDialog" :project="renamingProject" @renamed="handleRenamed" />
  </div>
</template>

<style scoped>
.dashboard-view {
  background-image:
    radial-gradient(circle at top left, color-mix(in srgb, var(--cp-accent) 10%, transparent), transparent 32%),
    radial-gradient(circle at top right, color-mix(in srgb, var(--cp-topbar-bg) 35%, transparent), transparent 28%);
}
</style>
