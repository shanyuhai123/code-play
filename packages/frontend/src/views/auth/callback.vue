<template>
  <div class="auth-callback">
    <el-result
      v-if="error"
      icon="error"
      title="Authentication Failed"
      :sub-title="errorMessage"
    >
      <template #extra>
        <el-button type="primary" @click="goToLogin">
          Back to Login
        </el-button>
      </template>
    </el-result>

    <div v-else class="loading">
      <el-icon class="is-loading" :size="40">
        <Loading />
      </el-icon>
      <p>Authenticating...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const error = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token as string
  const errorParam = route.query.error as string

  if (errorParam) {
    error.value = true
    errorMessage.value = 'Failed to authenticate with GitHub. Please try again.'
    return
  }

  if (!token) {
    error.value = true
    errorMessage.value = 'No authentication token received.'
    return
  }

  try {
    login(token)
    // Wait a bit for user data to load
    await new Promise(resolve => setTimeout(resolve, 500))
    router.push('/dashboard')
  } catch (err) {
    error.value = true
    errorMessage.value = 'Failed to complete authentication.'
  }
})

function goToLogin() {
  router.push('/login')
}
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.loading {
  text-align: center;
}

.loading p {
  margin-top: 16px;
  color: #666;
  font-size: 16px;
}
</style>
