<script setup lang="ts">
import type { SandboxActivityBarEmits, SandboxActivityBarProps } from '../typing'
import { Brush, Folder, FolderOpened } from '@element-plus/icons-vue'

defineProps<SandboxActivityBarProps>()

const emits = defineEmits<SandboxActivityBarEmits>()

const iconMap: Record<string, typeof FolderOpened> = {
  FolderOpened,
  Folder,
  Brush,
}
</script>

<template>
  <div class="flex w-12 shrink-0 flex-col items-center border-r border-(--cp-workspace-border) bg-(--cp-workspace-activity-bg) pt-1">
    <button
      v-for="item in items" :key="item.id" :title="item.label"
      class="relative h-12 w-12 flex cursor-pointer items-center justify-center border-none bg-transparent transition-colors"
      :class="sidebarVisible && activePanel === item.id ? 'text-(--cp-workspace-activity-active)' : 'text-(--cp-workspace-activity-inactive) hover:text-(--cp-workspace-activity-active)'"
      @click="emits('toggle', item.id)"
    >
      <div
        v-if="sidebarVisible && activePanel === item.id"
        class="absolute left-0 top-[25%] h-[50%] w-[2px] rounded-r bg-(--cp-workspace-activity-active)"
      />
      <el-icon :size="22">
        <component :is="iconMap[item.icon]" />
      </el-icon>
    </button>
  </div>
</template>
