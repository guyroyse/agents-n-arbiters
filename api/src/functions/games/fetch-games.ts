import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { FetchGamesResponse } from '@ana/types'

import responses from '@functions/http-responses.js'
import gameService from '@services/game-service.js'

export async function fetchGames(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a get saved games request.')

  try {
    const savedGames = await gameService.fetchAllGames()

    const response: FetchGamesResponse = savedGames.map(game => ({
      gameId: game.gameId,
      gameName: game.gameName,
      lastPlayed: game.lastPlayed
    }))

    return responses.ok(response)
  } catch (error) {
    context.error('Error fetching games:', error)
    return responses.serverError('Failed to fetch games')
  }
}
