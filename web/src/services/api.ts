import type { TakeGameTurnRequest, CreateGameRequest, LoadTemplateRequest } from '@api-types/request'

import type {
  ApiError,
  GameTurnData,
  GameLogData,
  SavedGameData,
  VersionData,
  LoadTemplateData
} from '@api-types/response'

export async function fetchVersionInfo(): Promise<VersionData> {
  return await apiCall<VersionData>('/api/version')
}

export async function takeTurn(gameId: string, command: string): Promise<GameTurnData> {
  const request: TakeGameTurnRequest = { command }
  return await apiCall<GameTurnData>(`/api/games/${gameId}/take-turn`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

export async function fetchGameTurns(gameId: string): Promise<GameTurnData[]> {
  return await apiCall<GameTurnData[]>(`/api/games/${gameId}/turns`)
}

export async function fetchGameLogs(gameId: string, count: number = 1000): Promise<GameLogData[]> {
  return await apiCall<GameLogData[]>(`/api/games/${gameId}/logs?count=${count}`)
}

export async function createNewGame(gameName: string): Promise<SavedGameData> {
  const request: CreateGameRequest = { gameName }
  return await apiCall<SavedGameData>('/api/games', {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

export async function fetchSavedGames(): Promise<SavedGameData[]> {
  return await apiCall<SavedGameData[]>('/api/games')
}

export async function deleteGame(gameId: string): Promise<void> {
  return await apiCall<void>(`/api/games/${gameId}`, {
    method: 'DELETE'
  })
}

export async function loadTemplate(templateData: LoadTemplateRequest): Promise<LoadTemplateData> {
  return await apiCall<LoadTemplateData>('/api/load-template', {
    method: 'POST',
    body: JSON.stringify(templateData)
  })
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })

  if (!response.ok) {
    const errorData: ApiError = await response.json()
    throw new Error(errorData.error)
  }

  return response.status === 204 ? (undefined as T) : await response.json()
}
