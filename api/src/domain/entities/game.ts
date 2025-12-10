import { fetchRedisClient } from '@clients/index.js'

const redisClient = await fetchRedisClient()

export type BaseEntityData = {
  name?: string
  description?: string
  entityPrompt?: string
  statuses?: string[]
}

export abstract class GameEntity {
  readonly entityId: string
  readonly entityType: string
  name = ''
  description = ''
  entityPrompt?: string
  #statuses: Set<string> = new Set()

  protected readonly gameId: string

  get statuses(): string[] {
    return Array.from(this.#statuses)
  }

  set statuses(statuses: string[]) {
    this.#statuses = new Set(statuses)
  }

  constructor(gameId: string, entityId: string, entityType: string) {
    this.gameId = gameId
    this.entityId = entityId
    this.entityType = entityType
  }

  addStatus(...statuses: string[]): void {
    statuses.forEach(status => this.#statuses.add(status))
  }

  removeStatus(...statuses: string[]): void {
    statuses.forEach(status => this.#statuses.delete(status))
  }

  hasStatus(status: string): boolean {
    return this.#statuses.has(status)
  }

  async save(): Promise<void> {
    const key = `game:${this.gameId}:entity:${this.entityId}`
    const json = this.toJSON() as Record<string, any>
    if (this.entityPrompt) json.entityPrompt = this.entityPrompt

    await redisClient.json.merge(key, '$', json)
  }

  toJSON() {
    return {
      entityId: this.entityId,
      entityType: this.entityType,
      name: this.name,
      description: this.description,
      statuses: this.statuses
    }
  }
}
