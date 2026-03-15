<script setup lang="ts">
import type { SandboxTitleBarEmits, SandboxTitleBarProps } from '../typing'
import { ArrowLeft } from '@element-plus/icons-vue'

defineProps<SandboxTitleBarProps>()

const emits = defineEmits<SandboxTitleBarEmits>()
</script>

<template>
  <div class="h-9 flex shrink-0 items-center border-b border-(--cp-workspace-border) bg-(--cp-workspace-titlebar-bg) px-3 text-(--cp-workspace-titlebar-text)">
    <button
      class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-inherit transition-colors hover:bg-(--cp-workspace-hover)"
      @click="emits('back')"
    >
      <el-icon :size="14">
        <ArrowLeft />
      </el-icon>
    </button>
    <span class="flex-1 text-center text-sm">
      {{ projectName || '未命名项目' }}
    </span>
    <span class="w-6" />
  </div>
</template>
