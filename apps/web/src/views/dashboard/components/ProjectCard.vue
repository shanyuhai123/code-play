<script setup lang="ts">
import type { ProjectCardEmits, ProjectCardProps } from '../typing'
import { TEMPLATES } from '@code-play/domain'
import { Delete, Edit, MoreFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

const { project } = defineProps<ProjectCardProps>()

const emits = defineEmits<ProjectCardEmits>()

dayjs.extend(relativeTime)

const templateColorMap: Record<string, string> = {
  'react': '#61dafb',
  'vue': '#42b883',
  'vanilla': '#94a3b8',
  'vanilla-ts': '#3178c6',
}

function getTemplateName(templateId: string) {
  return TEMPLATES.find(t => t.id === templateId)?.name ?? templateId
}

function getTemplateDotColor(templateId: string) {
  return templateColorMap[templateId] ?? '#94a3b8'
}
</script>

<template>
  <div
    class="project-card group cursor-pointer rounded-xl border p-5 transition-all duration-200 hover:border-(--cp-accent) hover:-translate-y-1"
    :style="{
      borderColor: 'var(--cp-dashboard-card-border)',
      background: 'var(--cp-dashboard-card-bg)',
      boxShadow: 'var(--cp-dashboard-card-shadow)',
    }"
    @click="emits('open', project.id)"
  >
    <div class="flex items-start justify-between">
      <h3 class="m-0 min-w-0 flex-1 truncate text-base font-semibold text-(--cp-text-primary)">
        {{ project.name }}
      </h3>
      <el-dropdown @command="(cmd: string) => cmd === 'rename' ? emits('rename', project) : emits('delete', project)">
        <button
          class="ml-2 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-(--cp-text-tertiary) opacity-0 transition-all hover:bg-(--cp-surface-muted) hover:text-(--cp-text-primary) group-hover:opacity-100"
          @click.stop
        >
          <el-icon :size="16">
            <MoreFilled />
          </el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="rename">
              <el-icon class="mr-2">
                <Edit />
              </el-icon>
              重命名
            </el-dropdown-item>
            <el-dropdown-item class="danger-item" command="delete" divided>
              <el-icon class="mr-2">
                <Delete />
              </el-icon>
              删除
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <span class="inline-flex items-center gap-1.5 text-xs text-(--cp-text-secondary)">
        <span
          class="inline-block h-2.5 w-2.5 rounded-full"
          :style="{ backgroundColor: getTemplateDotColor(project.templateId) }"
        />
        {{ getTemplateName(project.templateId) }}
      </span>
      <span class="text-xs text-(--cp-text-tertiary)">
        {{ dayjs(project.updatedAt).fromNow() }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.project-card:hover {
  box-shadow: var(--cp-dashboard-card-hover-shadow) !important;
}
</style>
