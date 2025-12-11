import { MultiAgentGraph, GameTurnAnnotation } from '@agents/index.js'
import { GameState } from '@domain/game-state.js'
import { log } from '@utils/logger-utils.js'

/**
 * Process a user command through the multi-agent workflow
 */
export async function processCommand(gameId: string, command: string): Promise<string> {
  const gameState = await fetchGameState(gameId)
  const workflow = buildWorkflow(gameState)
  return await executeWorkflow(workflow, command, gameState)
}

/**
 * Fetch and log the current game state
 */
async function fetchGameState(gameId: string): Promise<GameState> {
  const gameState = await GameState.fetch(gameId)
  log(gameId, 'CURRENT GAME STATE:', gameState)

  return gameState
}

/**
 * Build and log the multi-agent workflow graph
 */
function buildWorkflow(gameState: GameState) {
  const workflow = new MultiAgentGraph(gameState).build()
  log(gameState.gameId, 'MULTI-AGENT WORKFLOW STRUCTURE', workflow.getGraph())

  return workflow
}

/**
 * Execute the workflow and return the final narrative
 */
async function executeWorkflow(workflow: any, command: string, gameState: GameState): Promise<string> {
  const initialState: Partial<typeof GameTurnAnnotation.State> = {
    userCommand: command,
    gameState: gameState
  }
  log(gameState.gameId, 'MULTI-AGENT WORKFLOW STARTING with state:', initialState)

  const result = await workflow.invoke(initialState)
  log(gameState.gameId, 'MULTI-AGENT WORKFLOW COMPLETE with final state:', result)

  return result.finalNarrative
}
