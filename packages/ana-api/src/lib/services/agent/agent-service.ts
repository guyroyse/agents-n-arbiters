import { MultiAgentGraph } from './graph-builder.js'
import { fetchGameState } from '@domain/entities.js'
import { log } from '@utils'

export async function processCommand(gameId: string, command: string): Promise<string> {
  const gameState = await fetchGameState(gameId)
  const multiAgentGraph = new MultiAgentGraph(gameState)
  const workflow = multiAgentGraph.build()

  log(gameState.gameId, '🔗 MULTI-AGENT WORKFLOW STRUCTURE', workflow.getGraph())

  const result = await workflow.invoke({
    user_command: command,
    game_state: gameState
  })

  // Extract the final response from the custom state
  return result.final_response || 'No response generated'
}
