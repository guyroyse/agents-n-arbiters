import type { VersionInfo, TakeTurnRequest, TakeTurnResponse, GameHistoryEntry, SavedGame } from '@ana/shared'
import { ulid } from 'ulid'

export async function fetchVersionInfo(): Promise<VersionInfo> {
  const response = await fetch('/api/version')
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return await response.json()
}

export async function takeTurn(request: TakeTurnRequest): Promise<TakeTurnResponse> {
  // Simulate processing delay for better loading state demonstration
  await new Promise(resolve => setTimeout(resolve, 1500))

  const response = await fetch('/api/take-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return await response.json()
}

// Simulate loading game history (will be replaced with real API call)
export async function fetchGameHistory(_savedGameId: string): Promise<GameHistoryEntry[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Return some mock history for demo-game-001
  return [
    {
      command: 'look around',
      response: 'You are in a dimly lit room. There is a door to the north and a chest in the corner.'
    },
    { command: 'examine chest', response: 'The chest is old and weathered. It appears to be unlocked.' }
  ]

  // In a real implementation, fetch from API:
  return []
}

export async function createNewGame(gameName: string): Promise<string> {
  // For now, simulate network delay and return a generated ID
  // In the real implementation, the API would store the gameName with the savedGameId
  await new Promise(resolve => setTimeout(resolve, 500))
  console.log(`Creating new game: "${gameName}"`) // Temporary logging
  return ulid()
}

export async function fetchSavedGames(): Promise<SavedGame[]> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/saved-games')
  // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  // return await response.json()

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))

  // Return mock saved games
  return [
    {
      savedGameId: 'demo-game-001',
      gameName: 'Ancient Quest',
      lastPlayed: '2025-01-14T15:30:00Z'
    },
    {
      savedGameId: 'demo-game-002',
      gameName: 'Mysterious Adventure',
      lastPlayed: '2025-01-12T09:15:00Z'
    },
    {
      savedGameId: 'demo-game-003',
      gameName: 'Epic Journey',
      lastPlayed: '2025-01-10T14:45:00Z'
    }
  ]
}

export async function deleteGame(savedGameId: string): Promise<void> {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/saved-games/${savedGameId}`, {
  //   method: 'DELETE'
  // })
  // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))
  console.log(`Deleting game: ${savedGameId}`) // Temporary logging
}
