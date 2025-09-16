import dedent from 'dedent'
import { fetchLLMClient } from '@clients/llm-client.js'
import { log } from '@utils'
import {
  EntityAgentContributionSchema,
  GameTurnAnnotation,
  type EntityAgentContribution,
  type SelectedEntityAgent
} from './game-turn-state.js'
import type { FixtureEntity } from '@domain/entities.js'

type FixtureAgentReturnType = Partial<typeof GameTurnAnnotation.State>

export function fixtureAgent(nodeName: string) {
  const entityId = nodeName

  return async function (state: typeof GameTurnAnnotation.State): Promise<FixtureAgentReturnType> {
    const gameState = state.gameState
    const userCommand = state.userCommand
    const selections = state.selectedAgents as SelectedEntityAgent[]

    // Basic validation
    if (!gameState) throw new Error('Missing game state')
    if (!userCommand) throw new Error('Missing user command')

    // Extract useful data
    const { gameId, entities } = gameState

    // Find my entity data
    const entity = entities.find(entity => entity.id === entityId) as FixtureEntity
    if (!entity) throw new Error(`Entity not found for node: ${nodeName}`)

    // Find classifier reasoning for selecting me
    const selection = selections.find((selection: SelectedEntityAgent) => selection.entityId === entityId)
    const reasoning = selection?.reasoning ?? 'No reasoning provided'

    // Log input
    log(gameId, '🗿 FIXTURE AGENT - User command', userCommand)
    log(gameId, '🗿 FIXTURE AGENT - Entity', entity)
    log(gameId, '🗿 FIXTURE AGENT - Reasoning', reasoning)

    // Set up LLM with prompt and structured output
    const llm = await fetchLLMClient()
    const structuredLLM = llm.withStructuredOutput(EntityAgentContributionSchema)
    const prompt = buildFixturePrompt(entity, userCommand, reasoning)
    log(gameId, '🗿 FIXTURE AGENT - Sending to LLM', prompt)

    // Invoke LLM and parse structured output
    const agentResponse = (await structuredLLM.invoke(prompt)) as EntityAgentContribution
    log(gameId, '🗿 FIXTURE AGENT - LLM response', agentResponse)

    // Return the structured output directly
    return { agentContributions: agentResponse }
  }

  function buildFixturePrompt(entity: FixtureEntity, userCommand: string, reasoning: string) {
    return dedent`
      You are a FIXTURE AGENT in a multi-agent text adventure game system.
      Fixtures are immovable objects that can be interacted with but cannot be taken.

      TASK: Provide brief, fixture-specific information for the current player command.

      ANALYZE the command and RESPOND based on:
      - The current fixture data provided
      - The nature of the player's command as it relates to this specific fixture
      - The reasoning for why you were selected to respond

      FIXTURE DATA:
      ${JSON.stringify(entity)}

      SELECTION REASONING:
      ${reasoning}

      Keep responses concise. Only provide detail when the player specifically asks for it.
      Reference specific statuses when relevant and suggest available actions when appropriate.
      Focus on this fixture's specific characteristics and possible interactions.

      PLAYER COMMAND:
      ${userCommand}
    `
  }
}
