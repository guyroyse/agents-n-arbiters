import { HumanMessage } from '@langchain/core/messages'
import { buildMultiAgentGraph } from './graph-builder.js'
import type { ArbiterOutput } from './arbiter.js'

export async function processCommand(command: string): Promise<string> {
  const graph = await buildMultiAgentGraph()

  const initialState = {
    messages: [new HumanMessage({ content: command })]
  }

  const result = await graph.invoke(initialState)

  // Extract the structured output from the arbiter
  const arbiterMessage = result.messages[result.messages.length - 1]
  const arbiterOutput = JSON.parse(arbiterMessage.content as string) as ArbiterOutput

  return arbiterOutput.response
}
