import { fetchRedisClient } from '@ana/common'
import { GameEntity, type BaseEntityData } from './game-entity.js'

const redisClient = await fetchRedisClient()

type FixtureData = BaseEntityData & {
  actions?: string[]
}

export class FixtureEntity extends GameEntity {
  actions: string[] = []

  private constructor(gameId: string, entityId: string) {
    super(gameId, entityId, 'fixture')
  }

  static async fetch(gameId: string, entityId: string): Promise<FixtureEntity | null> {
    // load the fixture data, falling back to a template if not found
    let data = (await redisClient.json.get(`game:${gameId}:entity:${entityId}`)) as FixtureData
    if (!data) data = (await redisClient.json.get(`template:entity:${entityId}`)) as FixtureData
    if (!data) return null

    // create and return the fixture entity
    const fixture = this.create(gameId, entityId, data)
    return fixture
  }

  static async fetchMany(gameId: string, entityIds: string[]): Promise<FixtureEntity[]> {
    if (entityIds.length === 0) return []

    // Build keys for game-specific entities
    const gameKeys = entityIds.map(id => `game:${gameId}:entity:${id}`)
    const templateKeys = entityIds.map(id => `template:entity:${id}`)

    // Fetch game-specific data first, then templates for any missing ones
    //
    // NOTE: mGet returns arrays of matches to the pattern or null if the pattern is not found
    // So we get back an array of arrays or an array of nulls resulting in this janky type
    const rawGameData = (await redisClient.json.mGet(gameKeys, '$')) as (FixtureData[] | null)[]
    const gameData = rawGameData.map(data => (data ? data[0] : null)) as (FixtureData | null)[]

    const rawTemplateData = (await redisClient.json.mGet(templateKeys, '$')) as (FixtureData[] | null)[]
    const templateData = rawTemplateData.map(data => (data ? data[0] : null)) as (FixtureData | null)[]

    // Combine results, preferring game-specific data
    const fixtures: FixtureEntity[] = []
    for (let i = 0; i < entityIds.length; i++) {
      const data = gameData[i] ?? templateData[i]
      if (data) {
        const fixture = this.create(gameId, entityIds[i], data)
        fixtures.push(fixture)
      }
    }

    // Return the array of fixture entities
    return fixtures
  }

  private static create(gameId: string, entityId: string, data: FixtureData): FixtureEntity {
    const fixture = new FixtureEntity(gameId, entityId)
    fixture.name = data.name ?? ''
    fixture.description = data.description ?? ''
    fixture.statuses = data.statuses ?? []
    fixture.actions = data.actions ?? []
    fixture.entityPrompt = data.entityPrompt

    return fixture
  }

  toJSON() {
    return {
      ...super.toJSON(),
      actions: this.actions
    }
  }
}
