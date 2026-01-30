import { buildApp } from './app'
import { checkDockerConnection, ensureNetwork, ensureImage } from './docker/client'
import { connectRedis, disconnectRedis } from './redis/client'
import { config } from './config/env'

async function start() {
  try {
    // Check Docker connection
    const dockerConnected = await checkDockerConnection()
    if (!dockerConnected) {
      throw new Error('Docker is not available')
    }

    // Ensure Docker network and image
    await ensureNetwork()
    await ensureImage()

    // Connect to Redis
    await connectRedis()

    // Build and start the app
    const app = await buildApp()

    await app.listen({
      port: config.port,
      host: '0.0.0.0',
    })

    console.log(`🚀 Sandbox Manager running on http://localhost:${config.port}`)

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM']
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`)
        await app.close()
        await disconnectRedis()
        process.exit(0)
      })
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
