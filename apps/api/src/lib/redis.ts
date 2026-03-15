import type { RedisClientType } from 'redis'
import { createClient } from 'redis'
import { config } from '../config.js'

export const redis: RedisClientType = createClient({
  url: config.redisUrl,
})

redis.on('error', (error) => {
  console.error('Redis 连接异常:', error)
})

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect()
  }
}

export async function disconnectRedis() {
  if (redis.isOpen) {
    await redis.quit().catch(async () => {
      await redis.disconnect()
    })
  }
}
