import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

import type { TakeGameTurnRequest, TakeGameTurnResponse } from '@ana/types'

import responses from '@functions/http-responses.js'
import gameService from '@services/game-service.js'
import { processCommand } from '@services/agent-service.js'
import { log } from '@utils/logger-utils.js'

export async function takeGameTurn(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a take game turn request.')

  try {
    const gameId = request.params.gameId
    if (!gameId) return responses.badRequest('Game ID is required')

    const body = await request.json()
    const { command } = body as TakeGameTurnRequest

    context.log(`Processing turn for game ${gameId}: ${command}`)
    log(gameId, 'take-game-turn', `Processing command: ${command}`)

    // Process command through LLM agent service
    const reply = await processCommand(gameId, command)

    const gameTurn = await gameService.saveTurn(gameId, command, reply)

    const response: TakeGameTurnResponse = {
      command: gameTurn.command,
      reply: gameTurn.reply
    }

    return responses.ok(response)
  } catch (error) {
    context.error('Error processing take game turn request:', error)
    return responses.badRequest('Invalid request format')
  }
}
