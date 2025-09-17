import { fetchRedisClient } from '@clients/redis-client.js'
import { GameEntity } from './game-entity.js'
import { LocationEntity } from './location-entity.js'

const redisClient = await fetchRedisClient()

type PlayerData = {
  name?: string
  description?: string
  entityPrompt?: string
  locationId: string
}

export class PlayerEntity extends GameEntity {
  locationId = ''

  private constructor(gameId: string) {
    super(gameId, 'player', 'player')
  }

  static async fetch(gameId: string): Promise<PlayerEntity | null> {
    // load the player data, falling back to a template if not found
    let data = (await redisClient.json.get(`game:${gameId}:player`)) as PlayerData
    if (!data) data = (await redisClient.json.get(`template:entity:player`)) as PlayerData
    if (!data) return null

    // if there is no locationId, we can't proceed
    if (!data.locationId) throw new Error('Player entity is missing locationId')

    // create the player entity
    const player = new PlayerEntity(gameId)
    player.name = data.name ?? 'Player'
    player.description = data.description ?? ''
    player.locationId = data.locationId
    player.entityPrompt = data.entityPrompt

    // return the player entity
    return player
  }

  async save(): Promise<void> {
    const key = `game:${this.gameId}:player`
    await redisClient.json.set(key, '$', this.toJSON())
  }

  async location(): Promise<LocationEntity | null> {
    return await LocationEntity.fetch(this.gameId, this.locationId)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      locationId: this.locationId
    }
  }
}
