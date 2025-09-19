import dedent from 'dedent'
import { fetchLLMClient } from '@ana/common/clients'
import { log } from '@ana/common/utils'
import {
  GameTurnAnnotation,
  EntityChangesSchema,
  type EntityChangeRecommendation,
  type EntityChanges
} from '@/game-turn-state.js'
import type { GameEntity } from '@ana/domain'

type ArbiterReturnType = Partial<typeof GameTurnAnnotation.State>

export async function arbiter(state: typeof GameTurnAnnotation.State): Promise<ArbiterReturnType> {
  const gameState = state.gameState
  const userCommand = state.userCommand
  const entityChangeRecommendations = state.entityChangeRecommendations as EntityChangeRecommendation[]

  // Basic validation
  if (!gameState) throw new Error('Missing game state')
  if (!userCommand) throw new Error('Missing user command')

  // Extract useful data
  const { gameId } = gameState

  // Log input
  log(gameId, '⚖️  ARBITER - User command', userCommand)
  log(gameId, '⚖️  ARBITER - Entity change recommendations', entityChangeRecommendations)

  // If no recommendations provided, skip LLM call and return empty changes immediately
  if (entityChangeRecommendations.length === 0) return { entityChanges: [] }

  // Find full entity data for each selected entity
  const selectedEntityIds = state.selectedEntities.map(entity => entity.entityId)
  const selectedEntities = gameState.nearbyEntities.filter(entity => selectedEntityIds.includes(entity.entityId))
  log(gameId, '⚖️  ARBITER - Selected entities', selectedEntities)

  // Set up LLM with prompt and structured output
  const llm = await fetchLLMClient()
  const structuredLLM = llm.withStructuredOutput(EntityChangesSchema)
  const prompt = buildArbiterPrompt(userCommand, selectedEntities, entityChangeRecommendations)
  log(gameId, '⚖️  ARBITER - Sending to LLM', prompt)

  // Invoke LLM and parse structured output
  const entityChanges = (await structuredLLM.invoke(prompt)) as EntityChanges
  log(gameId, '⚖️  ARBITER - LLM response', entityChanges)

  // Return the determined changes
  return { entityChanges: entityChanges.entityChanges }
}

function buildArbiterPrompt(
  userCommand: string,
  selectedEntities: GameEntity[],
  entityChangeRecommendations: EntityChangeRecommendation[]
) {
  return dedent`
    You are the ARBITER in a multi-agent text adventure game system.

    TASK: Review entity change recommendations and determine the final changes to apply.

    Your role: Process structured recommendations from entity agents and decide what changes should happen based on the player's command.

    DECISION PROCESS:
    • Consider the original player command to understand intent
    • Review each agent's structured recommendations (addStatuses, removeStatuses, setProperties)
    • Resolve conflicts when multiple agents recommend contradictory changes
    • Ensure changes are logically consistent and feasible
    • Consider cross-entity effects that individual agents might miss

    CONFLICT RESOLUTION:
    • When agents disagree, choose the outcome that best matches player intent
    • Prioritize safety and game balance
    • Preserve narrative consistency
    • Use the original command to break ties

    CROSS-ENTITY CONSIDERATIONS:
    • Some actions affect multiple entities beyond what individual agents can see
    • Examples: lighting affects both object and location, breaking things affects area
    • Movement: exit agents may recommend player location changes - validate these are safe and logical

    If no recommendations are provided, return empty entityChanges array.

    PLAYER COMMAND: ${userCommand}

    SELECTED ENTITIES (current state):
    ${JSON.stringify(selectedEntities)}

    ENTITY CHANGE RECOMMENDATIONS:
    ${JSON.stringify(entityChangeRecommendations)}
  `
}
