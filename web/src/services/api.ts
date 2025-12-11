import type {
  VersionData,
  GameTurnData,
  SavedGameData,
  ApiError,
  TakeGameTurnRequest,
  CreateGameRequest,
  FetchVersionResponse,
  TakeGameTurnResponse,
  FetchGameTurnsResponse,
  CreateGameResponse,
  FetchGamesResponse
} from '@ana/types'

export async function fetchVersionInfo(): Promise<VersionData> {
  const response: FetchVersionResponse = await apiCall('/api/version')
  return response
}

export async function takeTurn(gameId: string, command: string): Promise<GameTurnData> {
  const request: TakeGameTurnRequest = { command }
  const response: TakeGameTurnResponse = await apiCall(`/api/games/${gameId}/take-turn`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response
}

export async function fetchGameTurns(gameId: string): Promise<GameTurnData[]> {
  const response: FetchGameTurnsResponse = await apiCall(`/api/games/${gameId}/turns`)
  return response
}

export async function createNewGame(gameName: string): Promise<SavedGameData> {
  const request: CreateGameRequest = { gameName }
  const response: CreateGameResponse = await apiCall('/api/games', {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response
}

export async function fetchSavedGames(): Promise<SavedGameData[]> {
  const response: FetchGamesResponse = await apiCall('/api/games')
  return response
}

export async function deleteGame(gameId: string): Promise<void> {
  const result: void = await apiCall(`/api/games/${gameId}`, {
    method: 'DELETE'
  })
  return result
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
