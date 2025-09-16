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

// Template entity types
export type PlayerTemplate = {
  entityId: string
  entityType: 'player'
  name: string
  description: string
  locationId: string
}

export type LocationTemplate = {
  entityId: string
  entityType: 'location'
  name: string
  description: string
  fixtureIds: string[]
}

export type FixtureTemplate = {
  entityId: string
  entityType: 'fixture'
  name: string
  description: string
  statuses: string[]
  actions: string[]
}

export type EntityTemplate = LocationTemplate | FixtureTemplate

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