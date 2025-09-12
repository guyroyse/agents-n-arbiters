import { BaseMessage, SystemMessage } from '@langchain/core/messages'
import { MessagesAnnotation } from '@langchain/langgraph'
import { z } from 'zod'
import dedent from 'dedent'
import { fetchLLMClient } from '@clients/llm-client.js'
import type { FixtureEntity } from '@domain/entities.js'
import { logMessages, logJson, toPrettyJsonString } from '@utils'

const FixtureAgentOutputSchema = z.object({
  entity_id: z.string().describe('ID of the fixture entity this response is from'),
  statuses: z
    .array(z.string())
    .describe('Complete updated statuses array for the fixture (include all statuses - both changed and unchanged)'),
  message: z.string().describe('Message from the fixture agent to the arbiter about the current command')
})

export type FixtureAgentOutput = z.infer<typeof FixtureAgentOutputSchema>

const FIXTURE_AGENT_PROMPT = dedent`
  You are a FIXTURE AGENT in a multi-agent text adventure game system.
  Fixtures are immovable objects that can be interacted with but cannot be taken.

  TASK: Provide brief, fixture-specific information based on the current player command.

  ANALYZE the command and RESPOND based on:
  - The current fixture data in the JSON provided (id, name, description, location, statuses, actions)
  - Whether the player's command matches any available actions or relates to current statuses

  JSON INPUT:
  - Contains the current fixture data
  - Fixtures have an id, name, and description
  - Fixtures have statuses describing the current conditions of that fixture like "covered in vines", "intact", "locked"
  - Fixtures have actions describing possible interactions with that fixture like "examine closely", "remove vines (if present)"

  GUIDELINES:
  - Reference specific statuses when relevant and suggest available actions when appropriate.
  - If the player attempts an action not in the actions array, explain why it's not possible.
  - Always return the complete statuses array - include unchanged statuses plus any additions/removals from the player's action.
  - If the player's action changes statuses (e.g., "remove vines" removes "covered in vines"), return the updated complete array.
  - If no status changes occur, return the original statuses array unchanged.

  Keep responses concise. Only provide detail when the player specifically asks for it.
`

export function fixtureAgent(entity: FixtureEntity, nodeName: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    logMessages('🗿 FIXTURE AGENT: Input state', state.messages)

    const llm = await fetchLLM()
    const inputMessages = buildInputMessages(state, entity)
    logMessages('🗿 FIXTURE AGENT: Sending to LLM', inputMessages)

    const output = (await llm.invoke(inputMessages)) as FixtureAgentOutput
    logJson('🗿 FIXTURE AGENT: LLM output', output)

    const outputMessages = buildOutputMessages(state, output, nodeName)
    logMessages('🗿 FIXTURE AGENT: Output state', outputMessages)
    return outputMessages
  }

  async function fetchLLM() {
    const llm = await fetchLLMClient()
    return llm.withStructuredOutput(FixtureAgentOutputSchema)
  }

  function buildInputMessages(state: typeof MessagesAnnotation.State, entity: FixtureEntity) {
    const entityDataMessage = buildEntityDataMessage(entity)
    const systemPromptMessage = buildSystemPromptMessage()
    return [entityDataMessage, systemPromptMessage, ...state.messages]
  }

  function buildOutputMessages(
    state: typeof MessagesAnnotation.State,
    output: FixtureAgentOutput,
    nodeName: string
  ): BaseMessage[] {
    const outputMessage = buildOutputMessage(output, nodeName)
    return [...state.messages, outputMessage]
  }

  function buildEntityDataMessage(entity: FixtureEntity) {
    const entityDataText = toPrettyJsonString({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      location: entity.location,
      statuses: entity.statuses,
      actions: entity.actions
    })
    return new SystemMessage({ content: entityDataText })
  }

  function buildSystemPromptMessage() {
    return new SystemMessage({ content: FIXTURE_AGENT_PROMPT })
  }

  function buildOutputMessage(output: FixtureAgentOutput, nodeName: string) {
    const response = new SystemMessage({
      content: toPrettyJsonString(output),
      name: nodeName
    })
    return response
  }
}
