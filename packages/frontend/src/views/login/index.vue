<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="logo">
          <h1>Code Play</h1>
          <p>Online Code Sandbox</p>
        </div>

        <div class="login-content">
          <h2>Welcome</h2>
          <p class="subtitle">Sign in to start coding</p>

          <el-button
            type="primary"
            size="large"
            class="github-login-btn"
            @click="handleGithubLogin"
          >
            <svg class="github-icon" viewBox="0 0 16 16" width="20" height="20">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
            Continue with GitHub
          </el-button>

          <div class="features">
            <div class="feature-item">
              <el-icon><Document /></el-icon>
              <span>Multiple Templates</span>
            </div>
            <div class="feature-item">
              <el-icon><Monitor /></el-icon>
              <span>Live Preview</span>
            </div>
            <div class="feature-item">
              <el-icon><Share /></el-icon>
              <span>Easy Sharing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, Monitor, Share } from '@element-plus/icons-vue'
import { useAuth } from '../composables/useAuth'

const { loginWithGithub } = useAuth()

function handleGithubLogin() {
  loginWithGithub()
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  width: 100%;
  max-width: 450px;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.logo {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 30px;
  text-align: center;
}

.logo h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

.logo p {
  margin: 8px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.login-content {
  padding: 40px 30px;
}

.login-content h2 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #333;
}

.subtitle {
  margin: 0 0 32px;
  color: #666;
  font-size: 14px;
}

.github-login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.github-icon {
  flex-shrink: 0;
}

.features {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-around;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 13px;
}

.feature-item .el-icon {
  font-size: 24px;
  color: #667eea;
}
</style>
