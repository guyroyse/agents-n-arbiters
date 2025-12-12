import { GameTemplate } from './game-template.js'

export class LocationTemplate extends GameTemplate {
  fixtureIds: string[]
  exitIds: string[]

  private constructor(
    entityId: string,
    name: string,
    description: string,
    fixtureIds: string[],
    exitIds: string[],
    statuses?: string[],
    entityPrompt?: string
  ) {
    super(entityId, 'location', name, description, statuses, entityPrompt)
    this.fixtureIds = fixtureIds
    this.exitIds = exitIds
  }

  static create(
    entityId: string,
    name: string,
    description: string,
    fixtureIds: string[],
    exitIds: string[],
    statuses?: string[],
    entityPrompt?: string
  ): LocationTemplate {
    return new LocationTemplate(entityId, name, description, fixtureIds, exitIds, statuses, entityPrompt)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fixtureIds: this.fixtureIds,
      exitIds: this.exitIds
    }
  }
}
