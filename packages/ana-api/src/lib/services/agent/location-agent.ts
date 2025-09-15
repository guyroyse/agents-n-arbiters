import { z } from 'zod'
import dedent from 'dedent'
import { fetchLLMClient } from '@clients/llm-client.js'
import { GameTurnAnnotation } from './game-turn-state.js'
import type { LocationEntity, GameState } from '@domain/entities.js'
import { toPrettyJsonString, log } from '@utils'
import type { Class } from 'zod/v4/core/util.js'

const LocationAgentOutputSchema = z.object({
  message: z.string().describe('Location-specific response about the current command')
})

export type LocationAgentOutput = z.infer<typeof LocationAgentOutputSchema>

export function locationAgent(nodeName: string) {
  return async function (state: typeof GameTurnAnnotation.State) {
    const gameState = state.game_state
    const userCommand = state.user_command
    const selection = state.agent_selection as ClassifierSelection | null

    // Basic validation
    if (!gameState) throw new Error('Missing game state')
    if (!userCommand) throw new Error('Missing user command')

    // Find my entity data
    const entity = gameState.entities.find(entity => entity.id === nodeName) as LocationEntity
    if (!entity) throw new Error(`Entity not found for node: ${nodeName}`)

    // Find classifier reasoning for selecting me
    const reasoning = getAgentReasoning(selection, nodeName)

    // Log input
    log(gameState.gameId, '🏛️  LOCATION AGENT - User command', userCommand)
    log(gameState.gameId, '🏛️  LOCATION AGENT - Entity', entity)
    log(gameState.gameId, '🏛️  LOCATION AGENT - Reasoning', reasoning)

    const llm = await fetchLLMClient()
    const structuredLLM = llm.withStructuredOutput(LocationAgentOutputSchema)

    const prompt = buildLocationPrompt(entity, userCommand, reasoning)
    const output = (await structuredLLM.invoke(prompt)) as LocationAgentOutput

    log(gameState.gameId, '🏛️  LOCATION AGENT', output)

    return {
      agent_outputs: [
        {
          agent_id: nodeName,
          agent_type: 'location' as const,
          content: output.message,
          reasoning: myReasoning
        }
      ]
    }
  }
}

function getAgentReasoning(selection: any, agentId: string): string {
  if (!selection?.selected_agents) return 'No reasoning provided'

  // Find my specific agent selection with reasoning
  const mySelection = selection.selected_agents.find((agent: any) => agent.agent_id === agentId)
  return mySelection?.reasoning || 'Selected for location context'
}

function buildLocationPrompt(entity: LocationEntity, userCommand: string, reasoning: string) {
  const locationData = toPrettyJsonString({
    id: entity.id,
    name: entity.name,
    description: entity.description
  })

  return dedent`
    You are a LOCATION AGENT in a multi-agent text adventure game system.
    Locations are places the player can be and move between and are the backdrop for other entities.

    TASK: Provide brief, location-specific information for the current player command.

    ANALYZE the command and RESPOND based on:
    - The current location data provided
    - Whether the player's command relates to the location or environmental details
    - The reasoning for why you were selected to respond

    LOCATION DATA:
    ${locationData}

    SELECTION REASONING: ${reasoning}

    Keep responses concise. Only provide detail when the player specifically asks for it.
    Include obvious status information when relevant (lighting, accessibility, atmosphere, exits).
    Focus on environmental descriptions and general area information.

    PLAYER COMMAND: ${userCommand}
  `
}
