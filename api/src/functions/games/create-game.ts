import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { ulid } from 'ulid'

import type { CreateGameRequest } from '@api-types/request.js'
import type { CreateGameResponse } from '@api-types/response.js'

import responses from '@functions/http-responses.js'
import gameService from '@services/game-service.js'
import { log } from '@utils/logger-utils.js'

export async function createGame(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a create saved game request.')

  try {
    const body = await request.json()
    const { gameName } = body as CreateGameRequest

    if (!gameName || typeof gameName !== 'string' || gameName.trim().length === 0) {
      return responses.badRequest('Game name is required and must be a non-empty string')
    }

    const gameId = ulid()
    const trimmedGameName = gameName.trim()
    const lastPlayed = new Date().toISOString()

    const savedGame = await gameService.saveGame(gameId, trimmedGameName, lastPlayed)

    context.log(`Created new game: "${trimmedGameName}" with ID: ${gameId}`)
    log(gameId, 'create-game', `Game created: "${trimmedGameName}"`)

    const response: CreateGameResponse = {
      gameId: savedGame.gameId,
      gameName: savedGame.gameName,
      lastPlayed: savedGame.lastPlayed
    }

    return responses.created(response)
  } catch (error) {
    context.error('Error creating game:', error)
    return responses.badRequest('Invalid request format')
  }
}
