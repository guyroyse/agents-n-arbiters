import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { FetchGameLogsResponse } from '@api-types/response.js'

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

    const gameLogs = await gameService.fetchGameLogs(gameId, count)

    const response: FetchGameLogsResponse = gameLogs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      gameId: log.gameId,
      contentType: log.contentType,
      prefix: log.prefix,
      content: log.content,
      messageType: log.messageType,
      messageName: log.messageName,
      messageIndex: log.messageIndex
    }))

    return responses.ok(response)
  } catch (error) {
    context.error('Error fetching game logs:', error)
    if (error instanceof Error && error.message === 'Count must be between 1 and 1000')
      return responses.badRequest(error.message)

    return responses.serverError('Failed to fetch game logs')
  }
}
