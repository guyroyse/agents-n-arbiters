import dedent from 'dedent'
import { MessagesAnnotation } from '@langchain/langgraph'
import { SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

import { fetchLLMClient } from '@clients/llm-client.js'
import { fetchAvailableAgents } from './available-agents.js'

export const ClassifierOutputSchema = z.object({
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

export async function classifier(state: typeof MessagesAnnotation.State) {
  const llm = await fetchLLMClient()
  const structuredLLM = llm.withStructuredOutput(ClassifierOutputSchema)

  const availableAgents = await fetchAvailableAgents()

  const classifierMessages = [
    new SystemMessage({
      content: JSON.stringify(availableAgents)
    }),
    new SystemMessage({
      content: dedent`
        TASK: Route player commands to appropriate game agents.

        ANALYZE the command and SELECT which agent(s) should handle it based on:
        - The available agents and their capabilities (provided above)
        - Which agents can contribute relevant information for this specific command
        - Whether multiple agents should provide input or just one

        Be precise. Only select agents that are directly relevant to the command.
      `
    }),
    ...state.messages
  ]

  const classifierOutput = (await structuredLLM.invoke(classifierMessages)) as ClassifierOutput

  const response = new SystemMessage({
    content: JSON.stringify(classifierOutput),
    name: 'classifier'
  })

  return {
    messages: [...state.messages, response]
  }
}
