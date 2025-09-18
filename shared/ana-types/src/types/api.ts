// Base field types for API entities
export type SavedGameId = { gameId: string }
export type SavedGameName = { gameName: string }
export type LastPlayed = { lastPlayed: string }

// Composed API entity types
export type SavedGame = SavedGameId & SavedGameName & LastPlayed

// Game turn types
export type GameCommand = { command: string }
export type GameReply = { reply: string }
export type GameTurn = GameCommand & GameReply

// Version info type
export type VersionInfo = {
  name: string
  version: string
  environment: string
}

// Base template type (mirrors BaseEntityData)
export type BaseTemplate = {
  entityId: string
  entityType: string
  name: string
  description: string
  statuses?: string[]
  entityPrompt?: string
}

// Template entity types
export type PlayerTemplate = BaseTemplate & {
  entityType: 'player'
  locationId: string
}

export type LocationTemplate = BaseTemplate & {
  entityType: 'location'
  fixtureIds: string[]
  exitIds: string[]
}

export type FixtureTemplate = BaseTemplate & {
  entityType: 'fixture'
  actions: string[]
}

export type ExitTemplate = BaseTemplate & {
  entityType: 'exit'
  destinationId: string
}

export type EntityTemplate = LocationTemplate | FixtureTemplate | ExitTemplate

export type TemplateData = {
  player: PlayerTemplate
  entities: EntityTemplate[]
}

// Game log entry type
export type GameLogEntry = {
  id: string
  timestamp: number
  gameId: string
  contentType: string
  prefix: string
  content: string
  messageType?: string
  messageName?: string
  messageIndex?: number
}

// Common error type
export type ApiError = { error: string }