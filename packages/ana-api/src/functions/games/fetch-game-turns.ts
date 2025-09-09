import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

import responses from '../../lib/http-responses.js'
import gameService from '../../lib/game-service.js'

export async function fetchGameTurns(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a fetch game turns request.')

  try {
    const gameId = request.params.gameId
    if (!gameId) return responses.badRequest('Game ID is required')

    const turns = await gameService.fetchGameTurns(gameId)

    return responses.ok(turns)
  } catch (error) {
    context.error('Error fetching game turns:', error)
    return responses.serverError('Failed to fetch game turns')
  }
}
