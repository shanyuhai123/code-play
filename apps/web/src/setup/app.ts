import type { Component } from 'vue'
import { createApp } from 'vue'

export default function setupCreateApp(component: Component) {
  const app = createApp(component)

  return app
}
