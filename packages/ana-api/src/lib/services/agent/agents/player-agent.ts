import dedent from 'dedent'

import { fetchLLMClient } from '@clients/llm-client.js'
import { log } from '@utils'
import {
  EntityAgentContributionSchema,
  GameTurnAnnotation,
  type EntityAgentContribution,
  type SelectedEntityAgent
} from '@services/agent/state/game-turn-state.js'
import type { PlayerEntity } from '@domain/player-entity.js'

type PlayerAgentReturnType = Partial<typeof GameTurnAnnotation.State>

export function playerAgent(nodeName: string) {
  const entityId = nodeName

  return async function (state: typeof GameTurnAnnotation.State): Promise<PlayerAgentReturnType> {
    const gameState = state.gameState
    const userCommand = state.userCommand
    const selections = state.selectedAgents as SelectedEntityAgent[]

    // Basic validation
    if (!gameState) throw new Error('Missing game state')
    if (!userCommand) throw new Error('Missing user command')

    // Extract useful data
    const { gameId, nearbyEntities } = gameState

    // Find my entity data
    const entity = nearbyEntities.find(entity => entity.entityId === entityId) as PlayerEntity
    if (!entity) throw new Error(`Entity not found for node: ${nodeName}`)

    // Find classifier reasoning for selecting me
    const selection = selections.find((selection: SelectedEntityAgent) => selection.entityId === entityId)
    const reasoning = selection?.reasoning ?? 'No reasoning provided'

    // Log input
    log(gameId, '🧑 PLAYER AGENT - User command', userCommand)
    log(gameId, '🧑 PLAYER AGENT - Entity', entity)
    log(gameId, '🧑 PLAYER AGENT - Entity prompt', entity.entityPrompt ?? 'None')
    log(gameId, '🧑 PLAYER AGENT - Reasoning', reasoning)

    // Set up LLM with prompt and structured output
    const llm = await fetchLLMClient()
    const structuredLLM = llm.withStructuredOutput(EntityAgentContributionSchema)
    const prompt = buildPlayerPrompt(entity, userCommand, reasoning)
    log(gameId, '🧑 PLAYER AGENT - Sending to LLM', prompt)

    // Invoke LLM and parse structured output
    const agentResponse = (await structuredLLM.invoke(prompt)) as EntityAgentContribution
    log(gameId, '🧑 PLAYER AGENT - LLM response', agentResponse)

    // Return the structured output directly
    return { agentContributions: agentResponse }
  }

  function buildPlayerPrompt(entity: PlayerEntity, userCommand: string, reasoning: string) {
    return dedent`
      You are a PLAYER AGENT in a multi-agent text adventure game system.
      You represent the player character and handle commands related to the player's personal state, abilities, and introspection.

      TASK: Provide information about the player character for the current command.

      ANALYZE the command and RESPOND based on:
      - The current player data provided
      - The nature of the player's command as it relates to personal state, inventory, abilities, or self-examination
      - The reasoning for why you were selected to respond

      PLAYER AGENT RESPONSIBILITIES:
      - Handle personal introspection commands (who am I, what am I wearing, how do I feel)
      - Manage inventory-related queries (what do I have, what am I carrying)
      - Respond to status checks (am I hurt, what's my condition, what can I do)
      - Handle character ability queries (what are my skills, what can I do)
      - Provide self-description and character background information
      - Handle meta-character commands that relate to the player's internal state

      PLAYER DATA:
      ${JSON.stringify(entity)}

      SELECTION REASONING:
      ${reasoning}

      ${entity.entityPrompt ? 'PLAYER-SPECIFIC INSTRUCTIONS:' : ''}
      ${entity.entityPrompt ?? ''}

      GENERAL GUIDELINES:
      Keep responses personal and from the character's perspective.
      Focus on the player's internal state, capabilities, and personal inventory.
      Only respond to commands that specifically relate to the player character.
      Do NOT respond to commands about the external world, locations, other characters, or objects.

      PLAYER COMMAND:
      ${userCommand}
    `
  }
}
