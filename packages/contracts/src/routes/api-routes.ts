export const API_ROUTES = {
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:projectId',
  PROJECT_FILE: '/projects/:projectId/files',
  SANDBOX_SESSION: '/sandbox/:projectId',
  TERMINAL: '/terminal/:projectId',
} as const
