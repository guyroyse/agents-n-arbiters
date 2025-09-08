import type { SavedGameName, GameCommand } from './api-types.js'

// Game management requests
export type CreateGameRequest = SavedGameName
export type UpdateGameNameRequest = SavedGameName

// Game turn request
export type TakeGameTurnRequest = GameCommand