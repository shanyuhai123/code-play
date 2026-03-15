import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    name: 'dashboard',
    path: '/dashboard',
    component: () => import('../views/dashboard/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    name: 'sandbox',
    path: '/sandbox/:id',
    component: () => import('../views/sandbox/index.vue'),
    meta: { requiresAuth: true },
  },
]
