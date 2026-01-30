import { buildApp } from './app'
import { connectDatabase, disconnectDatabase } from './config/database'
import { connectRedis, disconnectRedis } from './redis/client'
import { config } from './config/env'

async function start() {
  try {
    // Connect to database and redis
    await connectDatabase()
    await connectRedis()

    // Build and start the app
    const app = await buildApp()

    await app.listen({
      port: config.port,
      host: '0.0.0.0',
    })

    console.log(`🚀 Backend server running on http://localhost:${config.port}`)

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM']
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`)
        await app.close()
        await disconnectDatabase()
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
