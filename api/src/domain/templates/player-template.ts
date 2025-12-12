import { GameTemplate } from './game-template.js'

export class PlayerTemplate extends GameTemplate {
  locationId: string

  private constructor(
    name: string,
    description: string,
    locationId: string,
    statuses?: string[],
    entityPrompt?: string
  ) {
    super('player', 'player', name, description, statuses, entityPrompt)
    this.locationId = locationId
  }

  static create(
    name: string,
    description: string,
    locationId: string,
    statuses?: string[],
    entityPrompt?: string
  ): PlayerTemplate {
    return new PlayerTemplate(name, description, locationId, statuses, entityPrompt)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      locationId: this.locationId
    }
  }
}
