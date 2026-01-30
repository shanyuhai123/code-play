import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

export default async function setupRouter(app: App, routes: RouteRecordRaw[]) {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  })

  // Navigation guard for authentication
  router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('auth_token')
    const requiresAuth = to.meta.requiresAuth !== false // Default to true

    if (requiresAuth && !token) {
      // Redirect to login if authentication is required but no token
      next('/login')
    } else if (to.path === '/login' && token) {
      // Redirect to dashboard if already logged in
      next('/dashboard')
    } else {
      next()
    }
  })

  app.use(router)
  await router.isReady()
}
