import type { VersionInfo, TakeTurnRequest, TakeTurnResponse, GameHistoryEntry } from '@ana/shared'

export async function fetchVersionInfo(): Promise<VersionInfo> {
  const response = await fetch('/api/version')
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return await response.json()
}

export async function takeTurn(request: TakeTurnRequest): Promise<TakeTurnResponse> {
  const response = await fetch('/api/take-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return await response.json()
}

// Simulate loading game history (will be replaced with real API call)
export async function fetchGameHistory(savedGameId: string): Promise<GameHistoryEntry[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Return some mock history for demo-game-001
  if (savedGameId === 'demo-game-001') {
    return [
      {
        command: 'look around',
        response: 'You are in a dimly lit room. There is a door to the north and a chest in the corner.'
      },
      { command: 'examine chest', response: 'The chest is old and weathered. It appears to be unlocked.' }
    ]
  }

  return []
}
