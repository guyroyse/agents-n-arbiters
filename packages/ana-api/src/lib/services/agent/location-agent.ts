import { BaseMessage, SystemMessage } from '@langchain/core/messages'
import { MessagesAnnotation } from '@langchain/langgraph'
import { z } from 'zod'
import dedent from 'dedent'
import { fetchLLMClient } from '@clients/llm-client.js'
import type { LocationEntity } from '@domain/entities.js'
import { logMessages, logJson, toPrettyJsonString } from '@utils'

const LocationAgentOutputSchema = z.object({
  entity_id: z.string().describe('ID of the location entity this response is from'),
  message: z.string().describe('Message from the location agent to the arbiter about the current command')
})

export type LocationAgentOutput = z.infer<typeof LocationAgentOutputSchema>

const LOCATION_AGENT_PROMPT = dedent`
  You are a LOCATION AGENT in a multi-agent text adventure game system.
  Locations are places the player can be and move between and are the backdrop for other entities.

  TASK: Provide brief, location-specific information for the current player command.

  ANALYZE the command and RESPOND based on:
  - The current location data in the JSON provided (id, name, description)
  - Whether the player's command relates to the location or details about it

  JSON INPUT:
  - Contains the current location data
  - Locations have an id, name, and description

  Keep responses concise. Only provide detail when the player specifically asks for it.
  Include obvious status information when relevant (lighting, accessibility, atmosphere, etc.).
`

export function locationAgent(entity: LocationEntity, nodeName: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    logMessages('🏛️  LOCATION AGENT: Input state', state.messages)

    const llm = await fetchLLM()
    const inputMessages = buildInputMessages(state, entity)
    logMessages('🏛️  LOCATION AGENT: Sending to LLM', inputMessages)

    const output = (await llm.invoke(inputMessages)) as LocationAgentOutput
    logJson('🏛️  LOCATION AGENT: LLM output', output)

    const outputMessages = buildOutputMessages(state, output, nodeName)
    logMessages('🏛️  LOCATION AGENT: Output state', outputMessages)

    return { messages: outputMessages }
  }

  async function fetchLLM() {
    const llm = await fetchLLMClient()
    return llm.withStructuredOutput(LocationAgentOutputSchema)
  }

  function buildInputMessages(state: typeof MessagesAnnotation.State, entity: LocationEntity) {
    const entityDataMessage = buildEntityDataMessage(entity)
    const systemPromptMessage = buildSystemPromptMessage()
    return [entityDataMessage, systemPromptMessage, ...state.messages]
  }

  function buildOutputMessages(
    state: typeof MessagesAnnotation.State,
    output: LocationAgentOutput,
    nodeName: string
  ): BaseMessage[] {
    const outputMessage = buildOutputMessage(output, nodeName)
    return [...state.messages, outputMessage]
  }

  function buildEntityDataMessage(entity: LocationEntity) {
    const entityDataText = toPrettyJsonString({
      id: entity.id,
      name: entity.name,
      description: entity.description
    })
    return new SystemMessage({ content: entityDataText })
  }

  function buildSystemPromptMessage() {
    return new SystemMessage({ content: LOCATION_AGENT_PROMPT })
  }

  function buildOutputMessage(output: LocationAgentOutput, nodeName: string) {
    const response = new SystemMessage({
      content: toPrettyJsonString(output),
      name: nodeName
    })
    return response
  }
}
