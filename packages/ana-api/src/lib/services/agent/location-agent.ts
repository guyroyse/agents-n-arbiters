import { SystemMessage } from '@langchain/core/messages'
import { MessagesAnnotation } from '@langchain/langgraph'
import { z } from 'zod'
import dedent from 'dedent'
import { fetchLLMClient } from '@clients/llm-client.js'
import type { LocationEntity } from '@domain/entities.js'

const LocationAgentOutputSchema = z.object({
  entity_id: z.string().describe('ID of the location entity this response is from'),
  message: z.string().describe('Message from the location agent to the arbiter about the current command')
})

export type LocationAgentOutput = z.infer<typeof LocationAgentOutputSchema>

const LOCATION_AGENT_PROMPT = dedent`
  You are a LOCATION AGENT in a multi-agent text adventure game system.

  TASK: Provide brief, location-specific information for the current player command.

  ANALYZE the command and RESPOND based on:
  - The current location data and capabilities (provided above)
  - Location descriptions, movement possibilities, environmental details
  - Spatial interactions and navigation options

  Keep responses concise. Only provide detail when the player specifically asks for it.
`

export function locationAgent(entity: LocationEntity, nodeName: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    const llm = await fetchLLM()
    const inputMessages = buildInputMessages(state, entity)
    const output = (await llm.invoke(inputMessages)) as LocationAgentOutput
    const outputMessages = buildOutputMessages(state, output, nodeName)

    return outputMessages
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

  function buildOutputMessages(state: typeof MessagesAnnotation.State, output: LocationAgentOutput, nodeName: string) {
    const outputMessage = buildOutputMessage(output, nodeName)
    return { messages: [...state.messages, outputMessage] }
  }

  function buildEntityDataMessage(entity: LocationEntity) {
    const entityDataText = JSON.stringify({
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
      content: JSON.stringify(output),
      name: nodeName
    })
    return response
  }
}
