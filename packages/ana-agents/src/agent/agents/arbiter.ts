import dedent from 'dedent'
import { fetchLLMClient } from '@ana/common/clients'
import { log } from '@ana/common/utils'
import {
  GameTurnAnnotation,
  ArbiterResponseSchema,
  type EntityRecommendation,
  type ArbiterResponse
} from '../state/game-turn-state.js'
import type { GameEntity } from '@ana/domain'

type ArbiterReturnType = Partial<typeof GameTurnAnnotation.State>

export async function arbiter(state: typeof GameTurnAnnotation.State): Promise<ArbiterReturnType> {
  const gameState = state.gameState
  const agentRecommendations = state.agentRecommendations as EntityRecommendation[]

  // Basic validation
  if (!gameState) throw new Error('Missing game state')

  // Find full entity data for each selected entity
  const selectedEntityIds = state.selectedEntities.map(entity => entity.entityId)
  const selectedEntities = gameState.nearbyEntities.filter(entity => selectedEntityIds.includes(entity.entityId))

  // Extract useful data
  const { gameId } = gameState

  // Log input
  log(gameId, '⚖️  ARBITER - Selected entities', selectedEntities)
  log(gameId, '⚖️  ARBITER - Agent recommendations', agentRecommendations)

  // Set up LLM with prompt and structured output
  const llm = await fetchLLMClient()
  const structuredLLM = llm.withStructuredOutput(ArbiterResponseSchema)
  const prompt = buildArbiterPrompt(selectedEntities, agentRecommendations)
  log(gameId, '⚖️  ARBITER - Sending to LLM', prompt)

  // Invoke LLM and parse structured output
  const arbiterResponse = (await structuredLLM.invoke(prompt)) as ArbiterResponse
  log(gameId, '⚖️  ARBITER - LLM response', arbiterResponse)

  // Return the approved changes
  return { approvedChanges: arbiterResponse.approvedChanges }
}

function buildArbiterPrompt(selectedEntities: GameEntity[], agentRecommendations: EntityRecommendation[]) {
  return dedent`
    You are the ARBITER in a multi-agent text adventure game system.

    TASK: Review agent state change recommendations and decide what changes should actually happen.

    Your role as Arbiter:
    - Review recommended changes from entity agents
    - Resolve any conflicts between recommendations
    - Add cross-entity effects (e.g., lit torch → lit room)
    - Decide final approved changes based on game logic

    Guidelines:
    - Accept most agent recommendations unless they conflict
    - When conflicts occur, choose the most logical outcome
    - Add secondary effects that agents couldn't see (cross-entity impacts)
    - Consider game balance and narrative consistency
    - If no recommendations were provided, return empty approved changes
    - For each approved change, provide clear reasoning

    Cross-entity effect examples:
    - Lit torch/lamp → location gains "lit" status
    - Triggered trap → player gains "injured" status
    - Activated magic → area gains magical effect status
    - Breaking objects → location gains "debris" status

    SELECTED ENTITIES (current state):
    ${JSON.stringify(selectedEntities)}

    AGENT RECOMMENDATIONS:
    ${JSON.stringify(agentRecommendations)}
  `
}
