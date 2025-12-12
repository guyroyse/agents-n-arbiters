import { GameTemplate } from './game-template.js'

export class ExitTemplate extends GameTemplate {
  destinationId: string

  private constructor(
    entityId: string,
    name: string,
    description: string,
    destinationId: string,
    statuses?: string[],
    entityPrompt?: string
  ) {
    super(entityId, 'exit', name, description, statuses, entityPrompt)
    this.destinationId = destinationId
  }

  static create(
    entityId: string,
    name: string,
    description: string,
    destinationId: string,
    statuses?: string[],
    entityPrompt?: string
  ): ExitTemplate {
    return new ExitTemplate(entityId, name, description, destinationId, statuses, entityPrompt)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      destinationId: this.destinationId
    }
  }
}
