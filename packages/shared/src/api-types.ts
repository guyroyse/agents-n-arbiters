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

// Common error type
export type ApiError = { error: string }