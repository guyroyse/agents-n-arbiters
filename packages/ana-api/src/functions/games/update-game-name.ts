import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

import type { UpdateGameNameRequest } from '@ana/shared'

import responses from '@functions/http-responses.js'
import gameService from '@services/game/game-service.js'
import { log } from '@utils'

export async function updateGameName(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed an update game name request.')

  try {
    const gameId = request.params.gameId
    if (!gameId) return responses.badRequest('Game ID is required')

    const body = await request.json()
    const { gameName } = body as UpdateGameNameRequest

    if (!gameName || typeof gameName !== 'string' || gameName.trim().length === 0) {
      return responses.badRequest('Game name is required and must be a non-empty string')
    }

    const trimmedGameName = gameName.trim()

    const updates = {
      gameName: trimmedGameName,
      lastPlayed: new Date().toISOString()
    }

    const updated = await gameService.updateGame(gameId, updates)
    if (!updated) return responses.notFound('Game not found')

    context.log(`Updated game: "${trimmedGameName}" with ID: ${gameId}`)
    log(gameId, 'update-game-name', `Game name updated: "${trimmedGameName}"`)

    const updatedGame = await gameService.fetchGame(gameId)
    return responses.ok(updatedGame)
  } catch (error) {
    context.error('Error updating game name:', error)
    return responses.badRequest('Invalid request format')
  }
}
