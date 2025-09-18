import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

import responses from '@functions/http-responses.js'
import gameService from '@services/game-service.js'

export async function fetchGameLogs(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a fetch game logs request.')

  try {
    const gameId = request.params.gameId
    if (!gameId) return responses.badRequest('Game ID is required')

    // Parse count parameter
    const url = new URL(request.url)
    const count = parseInt(url.searchParams.get('count') ?? '50')

    const logEntries = await gameService.fetchGameLogs(gameId, count)
    return responses.ok(logEntries)
  } catch (error) {
    context.error('Error fetching game logs:', error)
    if (error instanceof Error && error.message === 'Count must be between 1 and 1000')
      return responses.badRequest(error.message)

    return responses.serverError('Failed to fetch game logs')
  }
}
