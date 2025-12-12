import { GameTemplate } from './game-template.js'

export class FixtureTemplate extends GameTemplate {
  actions: string[]

  private constructor(
    entityId: string,
    name: string,
    description: string,
    actions: string[],
    statuses?: string[],
    entityPrompt?: string
  ) {
    super(entityId, 'fixture', name, description, statuses, entityPrompt)
    this.actions = actions
  }

  static create(
    entityId: string,
    name: string,
    description: string,
    actions: string[],
    statuses?: string[],
    entityPrompt?: string
  ): FixtureTemplate {
    return new FixtureTemplate(entityId, name, description, actions, statuses, entityPrompt)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      actions: this.actions
    }
  }
}
