import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

import responses from '@functions/http-responses.js'
import gameService from '@services/game/game-service.js'
import { log } from '@utils'

export async function deleteGame(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a delete game request.')

  try {
    const gameId = request.params.gameId

    if (!gameId) return responses.badRequest('Game ID is required')

    await gameService.removeGame(gameId)

    context.log(`Deleted game with ID: ${gameId}`)
    log(gameId, 'delete-game', 'Game deleted')

    return responses.noContent()
  } catch (error) {
    context.error('Error deleting game:', error)
    return responses.serverError('Failed to delete game')
  }
}