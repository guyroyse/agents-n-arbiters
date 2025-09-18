import { fetchRedisClient } from '@ana/common/clients'
import { GameEntity, type BaseEntityData } from './game.js'

const redisClient = await fetchRedisClient()

type ExitData = BaseEntityData & {
  destinationId?: string
}

export class ExitEntity extends GameEntity {
  destinationId = ''

  private constructor(gameId: string, entityId: string) {
    super(gameId, entityId, 'exit')
  }

  static async fetch(gameId: string, entityId: string): Promise<ExitEntity | null> {
    // load the exit data, falling back to a template if not found
    let data = (await redisClient.json.get(`game:${gameId}:entity:${entityId}`)) as ExitData
    if (!data) data = (await redisClient.json.get(`template:entity:${entityId}`)) as ExitData
    if (!data) return null

    // create and return the exit entity
    const exit = this.create(gameId, entityId, data)
    return exit
  }

  static async fetchMany(gameId: string, entityIds: string[]): Promise<ExitEntity[]> {
    if (entityIds.length === 0) return []

    // Build keys for game-specific entities
    const gameKeys = entityIds.map(id => `game:${gameId}:entity:${id}`)
    const templateKeys = entityIds.map(id => `template:entity:${id}`)

    // Fetch game-specific data first, then templates for any missing ones
    const rawGameData = (await redisClient.json.mGet(gameKeys, '$')) as (ExitData[] | null)[]
    const gameData = rawGameData.map(data => (data ? data[0] : null)) as (ExitData | null)[]

    const rawTemplateData = (await redisClient.json.mGet(templateKeys, '$')) as (ExitData[] | null)[]
    const templateData = rawTemplateData.map(data => (data ? data[0] : null)) as (ExitData | null)[]

    // Combine results, preferring game-specific data
    const exits: ExitEntity[] = []
    for (let i = 0; i < entityIds.length; i++) {
      const data = gameData[i] ?? templateData[i]
      if (data) {
        const exit = this.create(gameId, entityIds[i], data)
        exits.push(exit)
      }
    }

    return exits
  }

  private static create(gameId: string, entityId: string, data: ExitData): ExitEntity {
    const exit = new ExitEntity(gameId, entityId)
    exit.name = data.name ?? ''
    exit.description = data.description ?? ''
    exit.statuses = data.statuses ?? []
    exit.destinationId = data.destinationId ?? ''
    exit.entityPrompt = data.entityPrompt

    return exit
  }

  toJSON() {
    return {
      ...super.toJSON(),
      destinationId: this.destinationId
    }
  }
}