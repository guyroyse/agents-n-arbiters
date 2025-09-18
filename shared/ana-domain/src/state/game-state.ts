import type { GameEntity } from '@entities/game.js'
import { PlayerEntity } from '@entities/player.js'
import { LocationEntity } from '@entities/location.js'

export class GameState {
  readonly gameId: string
  readonly player: PlayerEntity
  readonly location: LocationEntity
  readonly nearbyEntities: GameEntity[]

  private constructor(gameId: string, player: PlayerEntity, location: LocationEntity, nearbyEntities: GameEntity[]) {
    this.gameId = gameId
    this.player = player
    this.location = location
    this.nearbyEntities = nearbyEntities
  }

  static async fetch(gameId: string): Promise<GameState> {
    // Load the player first
    const player = await PlayerEntity.fetch(gameId)
    if (!player) throw new Error(`No player found for game ${gameId}`)

    // Load the player's location
    const location = await LocationEntity.fetch(gameId, player.locationId)
    if (!location) throw new Error(`Player location ${player.locationId} not found`)

    // Load all entities in the location
    const locationEntities = await location.entities()

    // Build nearbyEntities array
    const nearbyEntities = [player, location, ...locationEntities]

    return new GameState(gameId, player, location, nearbyEntities)
  }

  toJSON() {
    return {
      gameId: this.gameId,
      player: this.player.toJSON(),
      location: this.location.toJSON(),
      nearbyEntities: this.nearbyEntities.map(e => e.toJSON())
    }
  }
}
