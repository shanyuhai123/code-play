import { createClient } from 'redis'
import { config } from '../config/env'

export const redis = createClient({
  url: config.redis.url,
})

redis.on('error', (err) => {
  console.error('Redis error:', err)
})

export async function connectRedis() {
  try {
    await redis.connect()
    console.log('✅ Redis connected')
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    process.exit(1)
  }
}

export async function disconnectRedis() {
  await redis.quit()
}
