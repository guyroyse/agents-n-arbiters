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
  - If no agents responded (empty agent responses), the command was about things NOT in the scene:
    * For help requests: Provide brief gameplay instructions (examine, look, go, take, etc.)
    * For actions on non-existent items (take sword, examine book, etc.): "You don't see that here."
    * For movement to non-existent exits (go north, enter cave, etc.): "You can't go that way."
    * For invalid game commands: "That isn't a valid action."
    * For abstract questions: "You can't do that right now."
    * IMPORTANT: Never allow actions on items/locations that agents didn't mention
    * Keep these responses very brief and direct
  - Always respond as the omniscient game narrator
  - Only provide detailed descriptions when the player specifically asks for them
  - Focus on immediate, actionable information over atmospheric flourishes
`

export function arbiter(nodeName: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    const agentResponses = getAgentResponses(state)
    if (agentResponses.length === 0) {
      console.log(`⚖️  ARBITER: No agent responses - generating fallback for irrelevant command`)
    } else {
      console.log(`⚖️  ARBITER: Synthesizing responses from ${agentResponses.length} agents`)
    }
    
    const llm = await fetchLLM()
    const inputMessages = buildInputMessages(state)
    const output = (await llm.invoke(inputMessages)) as ArbiterOutput
    
    console.log(`⚖️  ARBITER: Final response: "${output.response.substring(0, 150)}${output.response.length > 150 ? '...' : ''}"`)
    
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
