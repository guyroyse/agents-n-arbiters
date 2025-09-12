import dedent from 'dedent'
import { MessagesAnnotation } from '@langchain/langgraph'
import { SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

import { fetchLLMClient } from '@clients/llm-client.js'
import type { GameState } from '@domain/entities.js'
import { log, toPrettyJsonString } from '@utils'

const ClassifierOutputSchema = z.object({
  selected_agents: z
    .array(
      z.object({
        agent_id: z.string().describe('ID from available agents list'),
        reasoning: z.string().describe('One sentence why this specific agent is needed')
      })
    )
    .describe('Array of agents that should provide input for this command')
})

export type ClassifierOutput = z.infer<typeof ClassifierOutputSchema>

const CLASSIFIER_PROMPT = dedent`
  You are a CLASSIFIER in a multi-agent text adventure game system.

  TASK: Route player commands to appropriate game agents.

  ANALYZE the command and SELECT which agent(s) should handle it based on:
  - The available game entities in the JSON provided (locations and fixtures)
  - The names, descriptions, statuses, and actions of those entities
  - The content of the player's command (from the human message)
  - Which agents can contribute relevant information for this specific command
  - Whether the command relates to fixture statuses or available actions
  - Whether multiple agents should provide input or just one

  JSON INPUT:
  - Array containing the available game entities for the current scene
  - Entities include locations and fixtures
  - All entities have a name and description
  - Fixtures have statuses describing the current conditions of that fixture
  - Fixtures have actions describing possible interactions with that fixture
  
  SELECTION GUIDELINES:
  - Commands about the current location (look around, look, examine room, where am I) → select location agents
  - Commands about specific fixtures by name (examine altar, touch stone, look at door) → select those fixture agents
  - Commands matching fixture actions (remove vines, climb statue, place offering) → select relevant fixture agents
  - Commands asking about fixture status (is it locked, what condition) → select relevant fixture agents
  - General location examination (look around) → select location agents AND visible fixture agents
  - Meta-game commands (help, inventory, quit, save, status) → select NO agents
  - Commands about things not mentioned in available entities → select NO agents

  Be selective but not overly restrictive. If a command could reasonably involve scene entities, include the relevant agents.
`

export function classifier(gameState: GameState, nodeName: string) {
  const gameId = gameState.gameId
  const gameEntities = gameState.entities

  return async function (state: typeof MessagesAnnotation.State) {
    log(gameId, '🤖 CLASSIFIER: Input state', state.messages)

    const llm = await fetchLLM()

    const inputMessages = buildInputMessages(state)
    log(gameId, '🤖 CLASSIFIER: Sending to LLM', inputMessages)

    const output = (await llm.invoke(inputMessages)) as ClassifierOutput
    log(gameId, '🤖 CLASSIFIER: LLM output', output)

    const outputMessages = buildOutputMessages(state, output)
    log(gameId, '🤖 CLASSIFIER: Output state', outputMessages)

    return { messages: outputMessages }
  }

  async function fetchLLM() {
    const llm = await fetchLLMClient()
    return llm.withStructuredOutput(ClassifierOutputSchema)
  }

  function buildInputMessages(state: typeof MessagesAnnotation.State) {
    const gameEntitiesMessage = buildGameEntityMessage()
    const systemPromptMessage = buildSystemPromptMessage()
    return [gameEntitiesMessage, systemPromptMessage, ...state.messages]
  }

  function buildOutputMessages(state: typeof MessagesAnnotation.State, output: ClassifierOutput) {
    const outputMessage = buildOutputMessage(output)
    return [...state.messages, outputMessage]
  }

  function buildGameEntityMessage() {
    // TODO: consider passing in entire game state for more context
    const gameEntitiesJson = toPrettyJsonString(gameEntities)
    const gameEntitiesMessage = new SystemMessage({ content: gameEntitiesJson })
    return gameEntitiesMessage
  }

  function buildSystemPromptMessage() {
    const systemPromptMessage = new SystemMessage({ content: CLASSIFIER_PROMPT })
    return systemPromptMessage
  }

  function buildOutputMessage(output: ClassifierOutput) {
    const outputJson = toPrettyJsonString(output)
    const outputMessage = new SystemMessage({ content: outputJson, name: nodeName })
    return outputMessage
  }
}
