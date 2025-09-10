import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

import type { TakeGameTurnRequest, TakeGameTurnResponse } from '@ana/shared'

import responses from '../../lib/http-responses.js'
import gameService from '../../lib/game-service.js'
import { processCommand } from '../../lib/agent-service.js'

export async function takeGameTurn(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a take game turn request.')

  try {
    const gameId = request.params.gameId
    if (!gameId) return responses.badRequest('Game ID is required')

    const body = await request.json()
    const { command } = body as TakeGameTurnRequest

    context.log(`Processing turn for game ${gameId}: ${command}`)

    // Process command through LLM agent service
    const reply = await processCommand(command)
    
    const response: TakeGameTurnResponse = {
      command,
      reply
    }

    await gameService.saveTurn(gameId, response)

    return responses.ok(response)
  } catch (error) {
    context.error('Error processing take game turn request:', error)
    return responses.badRequest('Invalid request format')
  }
}
