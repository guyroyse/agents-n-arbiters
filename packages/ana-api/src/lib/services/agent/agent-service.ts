import { MultiAgentGraph } from './graph-builder.js'
import { fetchGameState } from '@domain/entities.js'
import { log } from '@utils'
import type { GameTurnAnnotation } from '@services/agent/state/game-turn-state.js'

export async function processCommand(gameId: string, command: string): Promise<string> {
  // Fetch the current game state
  const gameState = await fetchGameState(gameId)
  if (!gameState) throw new Error('Failed to fetch game state')
  log(gameId, '🔄 CURRENT GAME STATE:', gameState)

  // Build the multi-agent workflow graph
  const multiAgentGraph = new MultiAgentGraph(gameState)
  const workflow = multiAgentGraph.build()
  log(gameId, '🔗 MULTI-AGENT WORKFLOW STRUCTURE', workflow.getGraph())

  // Create the initial state for the workflow
  const initialState: Partial<typeof GameTurnAnnotation.State> = {
    userCommand: command,
    gameState: gameState
  }
  log(gameId, '🚦 MULTI-AGENT WORKFLOW STARTING with state:', initialState)

  // Invoke the workflow
  const result = await workflow.invoke(initialState)
  log(gameId, '✅ MULTI-AGENT WORKFLOW COMPLETE with final state:', result)

  // Extract the final response from the custom state
  return result.arbiterResponse.content
}
