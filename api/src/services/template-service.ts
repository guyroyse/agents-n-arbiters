import { fetchRedisClient } from '@clients/index.js'
import type { PlayerTemplateData, LocationTemplateData, FixtureTemplateData, ExitTemplateData } from '@ana/types'

const redisClient = await fetchRedisClient()

class TemplateService {
  private constructor() {}

  static async create(): Promise<TemplateService> {
    return new TemplateService()
  }

  async clearAllTemplates(): Promise<void> {
    await redisClient.flushAll()
  }

  async savePlayerTemplate(player: PlayerTemplateData): Promise<void> {
    await redisClient.json.set('template:entity:player', '$', player)
  }

  async saveLocationTemplate(location: LocationTemplateData): Promise<void> {
    await redisClient.json.set(`template:entity:${location.entityId}`, '$', location)
  }

  async saveFixtureTemplate(fixture: FixtureTemplateData): Promise<void> {
    await redisClient.json.set(`template:entity:${fixture.entityId}`, '$', fixture)
  }

  async saveExitTemplate(exit: ExitTemplateData): Promise<void> {
    await redisClient.json.set(`template:entity:${exit.entityId}`, '$', exit)
  }
}

export default await TemplateService.create()
