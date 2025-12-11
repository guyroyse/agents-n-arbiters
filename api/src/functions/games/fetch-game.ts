import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

import responses from '@functions/http-responses.js'
import gameService from '@services/game-service.js'

export async function fetchGame(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a fetch game request.')

  try {
    const gameId = request.params.gameId
    if (!gameId) return responses.badRequest('Game ID is required')

    const savedGame = await gameService.fetchGame(gameId)
    if (!savedGame) return responses.notFound('Game not found')

    return responses.ok(savedGame.toJSON())
  } catch (error) {
    context.error('Error fetching game:', error)
    return responses.serverError('Failed to fetch game')
  }
}
