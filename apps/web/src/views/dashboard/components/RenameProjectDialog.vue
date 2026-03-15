<script setup lang="ts">
import type { RenameProjectDialogEmits, RenameProjectDialogProps } from '../typing'
import { ref, watch } from 'vue'

const props = defineProps<RenameProjectDialogProps>()
const emits = defineEmits<RenameProjectDialogEmits>()
const visible = defineModel<boolean>({ required: true })
const renaming = ref(false)
const name = ref('')

watch(visible, (val) => {
  if (val && props.project) {
    name.value = props.project.name
  }
})

async function handleSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed || !props.project)
    return

  try {
    renaming.value = true
    emits('renamed', props.project.id, trimmed)
    ElMessage.success('重命名成功')
    visible.value = false
  }
  finally {
    renaming.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="重命名项目" width="400px" :close-on-click-modal="false">
    <el-input v-model="name" placeholder="输入新名称" maxlength="50" clearable @keyup.enter="handleSubmit" />
    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="renaming" :disabled="!name" @click="handleSubmit">
        重命名
      </el-button>
    </template>
  </el-dialog>
</template>
