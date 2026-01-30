import App from './App.vue'
import { routes } from './router'
import { setupAssets, setupCreateApp, setupRouter } from './setup'

async function setupApp() {
  await setupAssets()

  const app = setupCreateApp(App)
  await setupRouter(app, routes)

  app.mount('#app')
}

setupApp()
