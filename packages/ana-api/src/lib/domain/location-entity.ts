import { fetchRedisClient } from '@clients/redis-client.js'
import { GameEntity } from './game-entity.js'
import { FixtureEntity } from './fixture-entity.js'

const redisClient = await fetchRedisClient()

type LocationData = {
  name?: string
  description?: string
  fixtureIds?: string[]
}

export class LocationEntity extends GameEntity {
  fixtureIds: string[] = []
  private constructor(gameId: string, entityId: string) {
    super(gameId, entityId, 'location')
  }

  static async fetch(gameId: string, entityId: string): Promise<LocationEntity | null> {
    // load the location data, falling back to a template if not found
    let data = (await redisClient.json.get(`game:${gameId}:entity:${entityId}`)) as LocationData
    if (!data) data = (await redisClient.json.get(`template:entity:${entityId}`)) as LocationData
    if (!data) return null

    // create the location entity
    const location = new LocationEntity(gameId, entityId)
    location.name = data.name ?? ''
    location.description = data.description ?? ''
    location.fixtureIds = data.fixtureIds ?? []

    return location
  }

  async save(): Promise<void> {
    const key = `game:${this.gameId}:entity:${this.entityId}`
    await redisClient.json.set(key, '$', this.toJSON())
  }

  async fixtures(): Promise<FixtureEntity[]> {
    return await FixtureEntity.fetchMany(this.gameId, this.fixtureIds)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fixtureIds: this.fixtureIds
    }
  }
}
