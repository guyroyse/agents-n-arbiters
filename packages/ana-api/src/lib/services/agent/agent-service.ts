import { HumanMessage } from '@langchain/core/messages'
import { MultiAgentGraph } from './graph-builder.js'
import type { ArbiterOutput } from './arbiter.js'
import { fetchGameEntities } from '@domain/entities.js'
import { logWorkflow } from '@utils'

export async function processCommand(command: string): Promise<string> {
  const gameEntities = await fetchGameEntities()
  const multiAgentGraph = new MultiAgentGraph(gameEntities)
  const workflow = multiAgentGraph.build()

  logWorkflow('🔗 MULTI-AGENT WORKFLOW STRUCTURE', workflow)

  const result = await workflow.invoke({
    messages: [new HumanMessage({ content: command })]
  })

  // Extract the structured output from the arbiter
  const arbiterMessage = result.messages[result.messages.length - 1]
  const arbiterOutput = JSON.parse(arbiterMessage.content as string) as ArbiterOutput

  return arbiterOutput.response
}
