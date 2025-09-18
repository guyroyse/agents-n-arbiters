import type { SavedGameName, GameCommand, TemplateData } from './api-types.js'

// Game management requests
export type CreateGameRequest = SavedGameName
export type UpdateGameNameRequest = SavedGameName

// Game turn request
export type TakeGameTurnRequest = GameCommand

// Admin requests
export type LoadTemplateRequest = TemplateData