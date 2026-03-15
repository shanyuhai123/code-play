import App from './App.vue'
import { initializeTheme } from './composables/useTheme'
import { routes } from './router'
import { setupAssets, setupCreateApp, setupRouter } from './setup'
import { setupFonts } from './setup/fonts'

async function setupApp() {
  initializeTheme()
  await setupAssets()
  setupFonts()

  const app = setupCreateApp(App)
  await setupRouter(app, routes)

  app.mount('#app')
}

setupApp()
