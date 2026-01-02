// Game management requests
export type CreateGameRequest = {
  gameName: string
}

// Game turn request
export type TakeGameTurnRequest = {
  command: string
}

// Template types for admin interface
export type BaseTemplateData = {
  entityId: string
  entityType: string
  name: string
  description: string
  statuses?: string[]
  entityPrompt?: string
}

export type PlayerTemplateData = BaseTemplateData & {
  entityType: 'player'
  locationId: string
}

export type LocationTemplateData = BaseTemplateData & {
  entityType: 'location'
  fixtureIds: string[]
  exitIds: string[]
}

export type FixtureTemplateData = BaseTemplateData & {
  entityType: 'fixture'
  actions: string[]
}

export type ExitTemplateData = BaseTemplateData & {
  entityType: 'exit'
  destinationId: string
}

export type EntityTemplateData = LocationTemplateData | FixtureTemplateData | ExitTemplateData

export type TemplateData = {
  player: PlayerTemplateData
  entities: EntityTemplateData[]
}

// Admin requests
export type LoadTemplateRequest = TemplateData
