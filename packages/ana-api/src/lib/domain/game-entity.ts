export abstract class GameEntity {
  readonly entityId: string
  readonly entityType: string
  name = ''
  description = ''

  protected readonly gameId: string

  constructor(gameId: string, entityId: string, entityType: string) {
    this.gameId = gameId
    this.entityId = entityId
    this.entityType = entityType
  }

  toJSON() {
    return { entityId: this.entityId, entityType: this.entityType, name: this.name, description: this.description }
  }
}
