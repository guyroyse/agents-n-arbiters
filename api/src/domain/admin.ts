import { fetchRedisClient } from '@clients/index.js'

const redisClient = await fetchRedisClient()

/**
 * Admin domain object for system-level administrative operations.
 * Unlike other domain objects, this is purely static with no instances.
 */
export class Admin {
  private constructor() {
    // Prevent instantiation
  }

  /**
   * Clear all data from Redis.
   * WARNING: This is a destructive operation that wipes the entire database.
   */
  static async clearAll(): Promise<void> {
    await redisClient.flushAll()
  }
}

