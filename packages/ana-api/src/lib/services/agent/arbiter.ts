import { MessagesAnnotation } from '@langchain/langgraph'
import { SystemMessage } from '@langchain/core/messages'
import dedent from 'dedent'
import { fetchLLMClient } from '@clients/llm-client.js'

export async function arbiter(state: typeof MessagesAnnotation.State) {
  const llm = await fetchLLMClient()

  // Get the original human message and agent responses
  const humanMessages = state.messages.filter(msg => msg._getType() === 'human')
  const agentResponses = state.messages.filter(msg => 
    msg._getType() === 'ai' && msg.name !== 'classifier'
  )

  const arbiterMessages = [
    new SystemMessage({
      content: dedent`
        You are the arbiter in a multi-agent text adventure game system.
        
        Your role: Synthesize responses from multiple agents into a coherent, engaging game response.
        Your purpose: Create the final response that the player will see.
        
        The system flow: Classifier → Agents (parallel) → You (Arbiter) → Player
        Focus on: Combining agent insights into a single, natural narrative response.
        
        Guidelines:
        - Synthesize all agent responses into one cohesive response
        - Maintain the text adventure game tone and style
        - If only one agent responded, enhance and polish their response
        - If multiple agents responded, weave their inputs together naturally
        - Always respond as the game narrator, not as individual agents
      `
    }),
    ...humanMessages,
    ...agentResponses
  ]

  const response = await llm.invoke(arbiterMessages)

  return {
    messages: [...state.messages, response]
  }
}