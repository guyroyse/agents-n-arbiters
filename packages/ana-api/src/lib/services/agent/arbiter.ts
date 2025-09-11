import { MessagesAnnotation } from '@langchain/langgraph'
import { SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'
import dedent from 'dedent'
import { fetchLLMClient } from '@clients/llm-client.js'

const ArbiterOutputSchema = z.object({
  response: z.string().describe('The final game narrative response to show the player')
})

export type ArbiterOutput = z.infer<typeof ArbiterOutputSchema>

const ARBITER_PROMPT = dedent`
  You are the ARBITER in a multi-agent text adventure game system.
  
  TASK: Synthesize agent responses into a concise, engaging game narrative.
  
  Your role as Arbiter:
  - Combine insights from multiple agents into one cohesive response
  - Create the final response that the player will see
  - Maintain text adventure game tone and immersive storytelling
  - Weave agent inputs together naturally without revealing the multi-agent structure
  
  Guidelines:
  - Keep responses brief and focused
  - If only one agent responded, enhance and polish their response concisely
  - If multiple agents responded, synthesize them into a unified, terse narrative
  - If no agents responded, generate a generic but contextually relevant reply
  - Always respond as the omniscient game narrator
  - Only provide detailed descriptions when the player specifically asks for them
  - Focus on immediate, actionable information over atmospheric flourishes
  - If the player asks a question, provide a direct answer based on agent inputs
`

export function arbiter(nodeName: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    const llm = await fetchLLM()
    const inputMessages = buildInputMessages(state)
    const output = (await llm.invoke(inputMessages)) as ArbiterOutput
    const outputMessages = buildOutputMessages(state, output, nodeName)

    return outputMessages
  }

  async function fetchLLM() {
    const llm = await fetchLLMClient()
    return llm.withStructuredOutput(ArbiterOutputSchema)
  }

  function buildInputMessages(state: typeof MessagesAnnotation.State) {
    const humanMessages = getHumanMessages(state)
    const agentResponses = getAgentResponses(state)
    const systemPromptMessage = buildSystemPromptMessage()
    return [systemPromptMessage, ...humanMessages, ...agentResponses]
  }

  function buildOutputMessages(state: typeof MessagesAnnotation.State, output: ArbiterOutput, nodeName: string) {
    const outputMessage = buildOutputMessage(output, nodeName)
    return { messages: [...state.messages, outputMessage] }
  }

  function getHumanMessages(state: typeof MessagesAnnotation.State) {
    return state.messages.filter(msg => msg.getType() === 'human')
  }

  function getAgentResponses(state: typeof MessagesAnnotation.State) {
    return state.messages.filter(msg => msg.getType() === 'system' && msg.name && msg.name !== 'classifier')
  }

  function buildSystemPromptMessage() {
    return new SystemMessage({ content: ARBITER_PROMPT })
  }

  function buildOutputMessage(output: ArbiterOutput, nodeName: string) {
    const response = new SystemMessage({
      content: JSON.stringify(output),
      name: nodeName
    })
    return response
  }
}
