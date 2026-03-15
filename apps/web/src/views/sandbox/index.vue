<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import SandboxActivityBar from './components/SandboxActivityBar.vue'
import SandboxEditorPanel from './components/SandboxEditorPanel.vue'
import SandboxFileTree from './components/SandboxFileTree.vue'
import SandboxPreviewPanel from './components/SandboxPreviewPanel.vue'
import SandboxSidebar from './components/SandboxSidebar.vue'
import SandboxTerminalPanel from './components/SandboxTerminalPanel.vue'
import SandboxThemePanel from './components/SandboxThemePanel.vue'
import SandboxTitleBar from './components/SandboxTitleBar.vue'
import { useActivityBar } from './composables/useActivityBar'
import { useSandbox } from './composables/useSandbox'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => String(route.params.id || ''))

const {
  booting,
  bootMessage,
  currentFile,
  currentFileContent,
  currentLanguage,
  editorFiles,
  fileTree,
  isReady,
  openFile,
  openFileByPath,
  previewUrl,
  project,
} = useSandbox(projectId)

const { activePanel, items, sidebarVisible, togglePanel } = useActivityBar()
const { monacoTheme, themePreference } = useTheme()

const sidebarTitle = computed(() => {
  const item = items.value.find(i => i.id === activePanel.value)
  return item?.label ?? ''
})

function goBack() {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden bg-(--cp-page-bg) text-(--cp-text-primary)">
    <SandboxTitleBar
      :project-name="project?.name"
      @back="goBack"
    />

    <div class="flex min-h-0 flex-1">
      <SandboxActivityBar
        :active-panel="activePanel"
        :items="items"
        :sidebar-visible="sidebarVisible"
        @toggle="togglePanel"
      />

      <SandboxSidebar v-show="sidebarVisible" :title="sidebarTitle">
        <SandboxFileTree
          v-show="activePanel === 'explorer'"
          :boot-message="bootMessage"
          :booting="booting"
          :file-tree="fileTree"
          :ready="isReady"
          @open="openFile"
        />
        <SandboxThemePanel
          v-show="activePanel === 'theme'"
          v-model="themePreference"
        />
      </SandboxSidebar>

      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <div class="flex min-h-0 flex-1">
          <SandboxEditorPanel
            v-model="currentFileContent"
            class="min-w-0 flex-1"
            :boot-message="bootMessage"
            :booting="booting"
            :files="editorFiles"
            :file-path="currentFile"
            :language="currentLanguage"
            :ready="isReady"
            :template-id="project?.templateId"
            :theme="monacoTheme"
            :workspace-id="project?.id"
            @navigate="openFileByPath"
          />

          <SandboxPreviewPanel
            :boot-message="bootMessage"
            :booting="booting"
            :preview-url="previewUrl"
            :ready="isReady"
          />
        </div>

        <SandboxTerminalPanel
          :boot-message="bootMessage"
          :booting="booting"
          :project-id="projectId"
          :ready="isReady"
        />
      </div>
    </div>
  </div>
</template>
