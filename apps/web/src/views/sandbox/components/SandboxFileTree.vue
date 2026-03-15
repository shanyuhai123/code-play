<script setup lang="ts">
import type { SandboxFileTreeEmits, SandboxFileTreeProps } from '../typing'
import { Document, Folder } from '@element-plus/icons-vue'

defineProps<SandboxFileTreeProps>()

const emits = defineEmits<SandboxFileTreeEmits>()
</script>

<template>
  <div class="sandbox-file-tree min-h-0 flex-1 overflow-y-auto">
    <div v-if="booting || !ready" class="px-4 py-6 text-sm text-(--cp-workspace-text-muted)">
      {{ bootMessage }}
    </div>

    <el-tree
      v-else :data="fileTree" :props="{ label: 'name', children: 'children' }"
      class="bg-transparent p-1 [--el-bg-color:var(--cp-workspace-sidebar-bg)] [--el-fill-color-blank:var(--cp-workspace-sidebar-bg)] [--el-tree-expand-icon-color:var(--cp-workspace-text-muted)] [--el-tree-node-hover-bg-color:var(--cp-workspace-hover)] [--el-tree-text-color:var(--cp-workspace-text)]"
      node-key="path" @node-click="emits('open', $event)"
    >
      <template #default="{ node, data }">
        <span class="flex items-center gap-2 text-[13px]">
          <el-icon v-if="data.type === 'directory'" class="text-(--cp-workspace-icon)">
            <Folder />
          </el-icon>
          <el-icon v-else class="text-(--cp-workspace-icon)">
            <Document />
          </el-icon>
          <span>{{ node.label }}</span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<style scoped>
.sandbox-file-tree :deep(.el-tree) {
  background: transparent;
}

.sandbox-file-tree :deep(.el-tree-node__content) {
  margin: 1px 4px;
  border-radius: 8px;
  background: transparent;
  color: var(--cp-workspace-text);
}

.sandbox-file-tree :deep(.el-tree-node:focus > .el-tree-node__content) {
  background-color: var(--cp-workspace-hover);
}

.sandbox-file-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: color-mix(in srgb, var(--cp-workspace-highlight) 14%, transparent);
}

.sandbox-file-tree :deep(.el-tree-node__expand-icon) {
  color: var(--cp-workspace-text-muted);
}
</style>
