import type {
  VersionInfo,
  GameTurn,
  SavedGame,
  ApiError,
  TakeGameTurnRequest,
  CreateGameRequest,
  FetchVersionResponse,
  TakeGameTurnResponse,
  FetchGameTurnsResponse,
  CreateGameResponse,
  FetchGamesResponse
} from '@ana/types'

export async function fetchVersionInfo(): Promise<VersionInfo> {
  const response: FetchVersionResponse = await apiCall('/api/version')
  return response as VersionInfo
}

export async function takeTurn(gameId: string, command: string): Promise<GameTurn> {
  const request: TakeGameTurnRequest = { command }
  const response: TakeGameTurnResponse = await apiCall(`/api/games/${gameId}/take-turn`, {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response as GameTurn
}

export async function fetchGameTurns(gameId: string): Promise<GameTurn[]> {
  const response: FetchGameTurnsResponse = await apiCall(`/api/games/${gameId}/turns`)
  return response as GameTurn[]
}

export async function createNewGame(gameName: string): Promise<SavedGame> {
  const request: CreateGameRequest = { gameName }
  const response: CreateGameResponse = await apiCall('/api/games', {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return response as SavedGame
}

export async function fetchSavedGames(): Promise<SavedGame[]> {
  const response: FetchGamesResponse = await apiCall('/api/games')
  return response as SavedGame[]
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
