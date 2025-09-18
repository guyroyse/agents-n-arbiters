import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { ulid } from 'ulid'

import type { SavedGame, CreateGameRequest } from '@ana/types'

import responses from '@functions/http-responses.js'
import gameService from '@services/game/game-service.js'
import { log } from '@ana/common/utils'

export async function createGame(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a create saved game request.')

  try {
    const body = await request.json()
    const { gameName } = body as CreateGameRequest

    if (!gameName || typeof gameName !== 'string' || gameName.trim().length === 0) {
      return responses.badRequest('Game name is required and must be a non-empty string')
    }

    const gameId = ulid()
    const newGame: SavedGame = {
      gameId,
      gameName: gameName.trim(),
      lastPlayed: new Date().toISOString()
    }

    await gameService.saveGame(newGame)

    context.log(`Created new game: "${gameName}" with ID: ${gameId}`)
    log(gameId, 'create-game', `Game created: "${gameName}"`)

    return responses.created(newGame)
  } catch (error) {
    context.error('Error creating game:', error)
    return responses.badRequest('Invalid request format')
  }
}