import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

export default async function setupRouter(app: App, routes: RouteRecordRaw[]) {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  })

  app.use(router)
  await router.isReady()
}
