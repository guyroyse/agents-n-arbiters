import type { SavedGame, GameLogEntry } from '@ana/shared'

export async function fetchGames(): Promise<SavedGame[]> {
  const response = await fetch('/api/games')
  if (!response.ok) throw new Error(`Failed to fetch games: ${response.status} ${response.statusText}`)

  return response.json()
}

export async function fetchGameLogs(gameId: string, count: number = 50): Promise<GameLogEntry[]> {
  const response = await fetch(`/api/games/${gameId}/logs?count=${count}`)
  if (!response.ok) throw new Error(`Failed to fetch game logs: ${response.status} ${response.statusText}`)

  return response.json()
}
