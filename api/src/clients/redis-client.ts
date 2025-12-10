import { createClient } from 'redis'

export type RedisClient = ReturnType<typeof createClient>

let redisClient: RedisClient | null = null

export async function fetchRedisClient(): Promise<RedisClient> {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
    redisClient = await createClient({ url: redisUrl })
      .on('error', err => console.error('Redis connection error:', err))
      .on('connect', () => console.log('Connected to Redis'))
      .on('disconnect', () => console.log('Disconnected from Redis'))
      .connect()
  }

  return redisClient
}

export async function destroyRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}
