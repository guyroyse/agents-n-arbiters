import type { SavedGame, GameLogEntry, LoadTemplateRequest, LoadTemplateResponse } from '@ana/shared'

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

export async function loadTemplate(templateData: LoadTemplateRequest): Promise<LoadTemplateResponse> {
  const response = await fetch('/api/admin/load-template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(templateData)
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    throw new Error(error.error || `Failed to load template: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
