import dedent from 'dedent'

import { fetchLLMClient } from '@clients/llm-client.js'
import { log } from '@utils'
import {
  EntityAgentContributionSchema,
  GameTurnAnnotation,
  type EntityAgentContribution,
  type SelectedEntityAgent
} from '@services/agent/state/game-turn-state.js'
import type { LocationEntity } from '@domain/location-entity.js'

type LocationAgentReturnType = Partial<typeof GameTurnAnnotation.State>

export function locationAgent(nodeName: string) {
  const entityId = nodeName

  return async function (state: typeof GameTurnAnnotation.State): Promise<LocationAgentReturnType> {
    const gameState = state.gameState
    const userCommand = state.userCommand
    const selections = state.selectedAgents as SelectedEntityAgent[]

    // Basic validation
    if (!gameState) throw new Error('Missing game state')
    if (!userCommand) throw new Error('Missing user command')

    // Extract useful data
    const { gameId, entities } = gameState

    // Find my entity data
    const entity = entities.find(entity => entity.id === entityId) as LocationEntity
    if (!entity) throw new Error(`Entity not found for node: ${nodeName}`)

    // Find classifier reasoning for selecting me
    const selection = selections.find((selection: SelectedEntityAgent) => selection.entityId === entityId)
    const reasoning = selection?.reasoning ?? 'No reasoning provided'

    // Log input
    log(gameId, '🏛️  LOCATION AGENT - User command', userCommand)
    log(gameId, '🏛️  LOCATION AGENT - Entity', entity)
    log(gameId, '🏛️  LOCATION AGENT - Reasoning', reasoning)

    // Set up LLM with prompt and structured output
    const llm = await fetchLLMClient()
    const structuredLLM = llm.withStructuredOutput(EntityAgentContributionSchema)
    const prompt = buildLocationPrompt(entity, userCommand, reasoning)
    log(gameId, '🏛️  LOCATION AGENT - Sending to LLM', prompt)

    // Invoke LLM and parse structured output
    const agentResponse = (await structuredLLM.invoke(prompt)) as EntityAgentContribution
    log(gameId, '🏛️  LOCATION AGENT - LLM response', agentResponse)

    // Return the structured output directly
    return { agentContributions: agentResponse }
  }

  function buildLocationPrompt(entity: LocationEntity, userCommand: string, reasoning: string) {
    return dedent`
      You are a LOCATION AGENT in a multi-agent text adventure game system.
      Locations are places the player can be in and move between and are the backdrop for other entities.

      TASK: Provide brief, location-specific information for the current player command.

      ANALYZE the command and RESPOND based on:
      - The current location data provided
      - The nature of the player's command as it relates to the location or environmental details
      - The reasoning for why you were selected to respond

      LOCATION DATA:
      ${JSON.stringify(entity)}

      SELECTION REASONING:
      ${reasoning}

      Keep responses concise. Only provide detail when the player specifically asks for it.
      Include obvious status information when relevant (lighting, accessibility, atmosphere, exits).
      Focus on environmental descriptions and general area information.

      PLAYER COMMAND:
      ${userCommand}
    `
  }
}
