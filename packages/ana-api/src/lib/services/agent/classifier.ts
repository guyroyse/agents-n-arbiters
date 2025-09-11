import dedent from 'dedent'
import { MessagesAnnotation } from '@langchain/langgraph'
import { SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

import { fetchLLMClient } from '@clients/llm-client.js'
import type { GameEntities } from '@domain/entities.js'

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
  - The available agents and their capabilities (provided above)
  - Which agents can contribute relevant information for this specific command
  - Whether multiple agents should provide input or just one

  Be precise. Only select agents that are directly relevant to the command.
`

export function classifier(gameEntities: GameEntities, nodeName: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    const llm = await fetchLLM()

    const inputMessages = buildInputMessages(state)
    const output = (await llm.invoke(inputMessages)) as ClassifierOutput
    const outputMessages = buildOutputMessages(state, output)

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
    const gameEntitiesJson = JSON.stringify(gameEntities)
    const gameEntitiesMessage = new SystemMessage({ content: gameEntitiesJson })
    return gameEntitiesMessage
  }

  function buildSystemPromptMessage() {
    const systemPromptMessage = new SystemMessage({ content: CLASSIFIER_PROMPT })
    return systemPromptMessage
  }

  function buildOutputMessage(output: ClassifierOutput) {
    const outputJson = JSON.stringify(output)
    const outputMessage = new SystemMessage({ content: outputJson, name: nodeName })
    return outputMessage
  }
}
