import type { SavedGame, GameTurn, GameLogEntry, VersionInfo, ApiError } from './api-types.js'

// Success response types
export type FetchGamesResponse = SavedGame[]
export type CreateGameResponse = SavedGame
export type FetchGameResponse = SavedGame
export type FetchGameTurnsResponse = GameTurn[]
export type FetchGameLogsResponse = GameLogEntry[]
export type UpdateGameNameResponse = SavedGame
export type DeleteGameResponse = void

export type TakeGameTurnResponse = GameTurn

export type FetchVersionResponse = VersionInfo

export type LoadTemplateResponse = {
  message: string
  timestamp: string
  entitiesLoaded: {
    player: number
    entities: number
  }
}

// Union types for API responses (success | error)
export type FetchVersionApiResponse = FetchVersionResponse | ApiError
export type TakeGameTurnApiResponse = TakeGameTurnResponse | ApiError

export type FetchGamesApiResponse = FetchGamesResponse | ApiError
export type CreateGameApiResponse = CreateGameResponse | ApiError
export type FetchGameApiResponse = FetchGameResponse | ApiError
export type FetchGameTurnsApiResponse = FetchGameTurnsResponse | ApiError
export type FetchGameLogsApiResponse = FetchGameLogsResponse | ApiError
export type UpdateGameNameApiResponse = UpdateGameNameResponse | ApiError
export type DeleteGameApiResponse = DeleteGameResponse | ApiError

export type LoadTemplateApiResponse = LoadTemplateResponse | ApiError
