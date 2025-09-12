import { HumanMessage } from '@langchain/core/messages'
import { MultiAgentGraph } from './graph-builder.js'
import type { ArbiterOutput } from './arbiter.js'
import { fetchGameState } from '@domain/entities.js'
import { log } from '@utils'

export async function processCommand(gameId: string, command: string): Promise<string> {
  const gameState = await fetchGameState(gameId)
  const multiAgentGraph = new MultiAgentGraph(gameState)
  const workflow = multiAgentGraph.build()

  log(gameState.gameId, '🔗 MULTI-AGENT WORKFLOW STRUCTURE', workflow.getGraph())

  const result = await workflow.invoke({
    messages: [new HumanMessage({ content: command })]
  })

  // Extract the structured output from the arbiter
  const arbiterMessage = result.messages[result.messages.length - 1]
  const arbiterOutput = JSON.parse(arbiterMessage.content as string) as ArbiterOutput

  return arbiterOutput.response
}
