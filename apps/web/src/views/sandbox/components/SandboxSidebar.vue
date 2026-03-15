<script setup lang="ts">
import type { SandboxSidebarProps } from '../typing'

defineProps<SandboxSidebarProps>()
</script>

<template>
  <div class="w-[220px] flex shrink-0 flex-col overflow-hidden border-r border-(--cp-workspace-border) bg-(--cp-workspace-sidebar-bg)">
    <div class="h-8 flex shrink-0 items-center px-5 text-[11px] text-(--cp-workspace-sidebar-title) uppercase tracking-wider font-semibold">
      {{ title }}
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>
