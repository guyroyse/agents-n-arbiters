import { createClient } from 'redis'
import { DefaultAzureCredential } from '@azure/identity'
import { EntraidCredentialsProvider, EntraIdCredentialsProviderFactory, REDIS_SCOPE_DEFAULT } from '@redis/entraid'

export type RedisClient = ReturnType<typeof createClient>

let redisClient: RedisClient | null = null

export async function fetchRedisClient(): Promise<RedisClient> {
  if (!redisClient) {
    const client = await createRedisClient()
    redisClient = client
  }

  return redisClient
}

export async function destroyRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}

async function createRedisClient(): Promise<RedisClient> {
  const options = getRedisOptions()

  return await createClient(options)
    .on('error', err => console.error('Redis connection error:', err))
    .on('connect', () => console.log('Connected to Redis'))
    .on('disconnect', () => console.log('Disconnected from Redis'))
    .connect()
}

function getRedisOptions() {
  if (process.env.NODE_ENV === 'development') {
    return {
      url: getLocalRedisUrl()
    }
  } else {
    return {
      url: getAzureRedisUrl(),
      credentialsProvider: createCredentialsProvider()
    }
  }
}

function getLocalRedisUrl(): string {
  return process.env.REDIS_URL ?? 'redis://localhost:6379'
}

function getAzureRedisUrl(): string {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) throw new Error('REDIS_URL environment variable is required for production')
  return redisUrl
}

function createCredentialsProvider(): EntraidCredentialsProvider {
  const credential = new DefaultAzureCredential()
  return EntraIdCredentialsProviderFactory.createForDefaultAzureCredential({
    credential,
    scopes: REDIS_SCOPE_DEFAULT,
    tokenManagerConfig: {
      expirationRefreshRatio: 0.8
    }
  })
}
