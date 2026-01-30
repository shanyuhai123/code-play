import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    component: () => import('../views/login/index.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/auth/callback',
    component: () => import('../views/auth/callback.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    component: () => import('../views/dashboard/index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/sandbox/:id',
    component: () => import('../views/sandbox/index.vue'),
    meta: { requiresAuth: true },
  },
]
