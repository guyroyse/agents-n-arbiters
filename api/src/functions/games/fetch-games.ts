import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

import responses from '@functions/http-responses.js'
import gameService from '@services/game-service.js'

export async function fetchGames(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a get saved games request.')

  try {
    const savedGames = await gameService.fetchAllGames()
    return responses.ok(savedGames.map(game => game.toJSON()))
  } catch (error) {
    context.error('Error fetching games:', error)
    return responses.serverError('Failed to fetch games')
  }
}
