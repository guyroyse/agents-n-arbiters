import { SystemMessage } from '@langchain/core/messages'
import { MessagesAnnotation } from '@langchain/langgraph'
import { z } from 'zod'
import dedent from 'dedent'
import { fetchLLMClient } from '@clients/llm-client.js'
import type { FixtureEntity } from '@domain/entities.js'

const FixtureAgentOutputSchema = z.object({
  entity_id: z.string().describe('ID of the fixture entity this response is from'),
  status: z.string().describe('Current status of the fixture (e.g., locked, broken, intact, open, etc.)'),
  message: z.string().describe('Message from the fixture agent to the arbiter about the current command')
})

export type FixtureAgentOutput = z.infer<typeof FixtureAgentOutputSchema>

const FIXTURE_AGENT_PROMPT = dedent`
  You are a FIXTURE AGENT in a multi-agent text adventure game system.
  Fixtures are immovable objects that can be interacted with but cannot be taken.

  TASK: Provide brief, fixture-specific information for the current player command.

  ANALYZE the command and RESPOND based on:
  - The current fixture data and capabilities (provided above)
  - Fixture descriptions, availability, interactions
  - Fixture-based actions and state changes for immovable objects
  - The fixture's current status and any obvious conditions

  Keep responses concise. Only provide detail when the player specifically asks for it.
  Always mention obvious status when relevant (locked/unlocked, open/closed, damaged/intact, lit/dark, etc.).
`

export function fixtureAgent(entity: FixtureEntity, nodeName: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    console.log(`🗿 FIXTURE AGENT: Processing for fixture "${entity.name}" (${entity.id})`)
    
    const llm = await fetchLLM()
    const inputMessages = buildInputMessages(state, entity)
    const output = (await llm.invoke(inputMessages)) as FixtureAgentOutput
    
    console.log(`🗿 FIXTURE AGENT: Generated response: "${output.message.substring(0, 100)}${output.message.length > 100 ? '...' : ''}" (status: ${output.status})`)
    
    const outputMessages = buildOutputMessages(state, output, nodeName)

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

  function buildOutputMessages(state: typeof MessagesAnnotation.State, output: FixtureAgentOutput, nodeName: string) {
    const outputMessage = buildOutputMessage(output, nodeName)
    return { messages: [...state.messages, outputMessage] }
  }

  function buildEntityDataMessage(entity: FixtureEntity) {
    const entityDataText = JSON.stringify({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      location: entity.location,
      status: entity.status
    })
    return new SystemMessage({ content: entityDataText })
  }

  function buildSystemPromptMessage() {
    return new SystemMessage({ content: FIXTURE_AGENT_PROMPT })
  }

  function buildOutputMessage(output: FixtureAgentOutput, nodeName: string) {
    const response = new SystemMessage({
      content: JSON.stringify(output),
      name: nodeName
    })
    return response
  }
}
