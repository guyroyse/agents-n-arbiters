import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

import responses from '@functions/http-responses.js'
import gameService from '@services/game-service.js'

export async function fetchGames(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a get saved games request.')

  try {
    const games = await gameService.fetchAllGames()
    return responses.ok(games)
  } catch (error) {
    context.error('Error fetching games:', error)
    return responses.serverError('Failed to fetch games')
  }
}