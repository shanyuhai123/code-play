<script setup lang="ts">
import type { CreateProjectDialogEmits, CreateProjectDialogProps } from '../typing'
import { TEMPLATES } from '@code-play/domain'
import { ref, watch } from 'vue'

withDefaults(defineProps<CreateProjectDialogProps>(), {
  loading: false,
})

const emits = defineEmits<CreateProjectDialogEmits>()
const visible = defineModel<boolean>({ required: true })
const form = ref({
  name: '',
  templateId: '',
})

watch(visible, (val) => {
  if (val) {
    form.value = { name: '', templateId: '' }
  }
})

async function handleSubmit() {
  const name = form.value.name.trim()
  if (!name || !form.value.templateId)
    return

  emits('created', name, form.value.templateId)
}
</script>

<template>
  <el-dialog v-model="visible" title="新建项目" width="500px" :close-on-click-modal="false">
    <el-form :model="form" label-position="top">
      <el-form-item label="项目名称" required>
        <el-input v-model="form.name" placeholder="my-awesome-project" maxlength="50" clearable />
      </el-form-item>
      <el-form-item label="模板" required>
        <el-select v-model="form.templateId" placeholder="请选择模板" class="w-full">
          <el-option v-for="template in TEMPLATES" :key="template.id" :label="template.name" :value="template.id">
            <div class="flex flex-col gap-1">
              <span class="font-medium">{{ template.name }}</span>
              <span class="text-xs text-(--cp-text-tertiary)">{{ template.description }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" :disabled="!form.name || !form.templateId" @click="handleSubmit">
        创建
      </el-button>
    </template>
  </el-dialog>
</template>
