import { fetchRedisClient } from '@clients/index.js'

const redisClient = await fetchRedisClient()

export type BaseTemplateData = {
  name: string
  description: string
  statuses?: string[]
  entityPrompt?: string
}

export abstract class GameTemplate {
  readonly entityId: string
  readonly entityType: string
  name: string
  description: string
  statuses?: string[]
  entityPrompt?: string

  protected constructor(
    entityId: string,
    entityType: string,
    name: string,
    description: string,
    statuses?: string[],
    entityPrompt?: string
  ) {
    this.entityId = entityId
    this.entityType = entityType
    this.name = name
    this.description = description
    this.statuses = statuses
    this.entityPrompt = entityPrompt
  }

  async save(): Promise<void> {
    const key = `template:entity:${this.entityId}`
    const json = this.toJSON() as Record<string, any>
    await redisClient.json.set(key, '$', json)
  }

  toJSON() {
    return {
      entityId: this.entityId,
      entityType: this.entityType,
      name: this.name,
      description: this.description,
      statuses: this.statuses,
      entityPrompt: this.entityPrompt
    }
  }
}
