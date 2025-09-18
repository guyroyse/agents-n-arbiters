import { fetchRedisClient } from '@clients/redis-client.js'
import type { TemplateData } from '@ana/types'

export async function loadTemplate(template: TemplateData): Promise<void> {
  const redisClient = await fetchRedisClient()

  // Clear ALL Redis data - this will delete all saved games and templates
  await redisClient.flushAll()

  // Save player template
  await redisClient.json.set('template:entity:player', '$', template.player)

  // Save all other entities
  for (const entity of template.entities) {
    await redisClient.json.set(`template:entity:${entity.entityId}`, '$', entity)
  }

  console.log(`Template entities loaded successfully! (1 player, ${template.entities.length} entities)`)
}
