import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { FetchGameTurnsResponse } from '@ana/types'

import responses from '@functions/http-responses.js'
import gameService from '@services/game-service.js'

export async function fetchGameTurns(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a fetch game turns request.')

  try {
    const gameId = request.params.gameId
    if (!gameId) return responses.badRequest('Game ID is required')

    const gameTurns = await gameService.fetchGameTurns(gameId)

    const response: FetchGameTurnsResponse = gameTurns.map(turn => ({
      command: turn.command,
      reply: turn.reply
    }))

    return responses.ok(response)
  } catch (error) {
    context.error('Error fetching game turns:', error)
    return responses.serverError('Failed to fetch game turns')
  }
}
