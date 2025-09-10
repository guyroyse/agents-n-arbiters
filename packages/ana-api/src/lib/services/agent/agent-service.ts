import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph'
import { HumanMessage } from '@langchain/core/messages'
import { classifier, type ClassifierOutput } from './classifier.js'
import { locationAgent } from './location-agent.js'
import { itemAgent } from './item-agent.js'

// Simple function to process a command
export async function processCommand(command: string): Promise<string> {
  const graph = buildGraph()

  const initialState = {
    messages: [new HumanMessage({ content: command })]
  }

  const result = await graph.invoke(initialState)

  const lastMessage = result.messages[result.messages.length - 1]
  return lastMessage.content as string
}

function buildGraph() {
  return new StateGraph(MessagesAnnotation)
    .addNode('classifier', classifier)
    .addNode('location_agent', locationAgent)
    .addNode('item_agent', itemAgent)
    .addEdge(START, 'classifier')
    .addConditionalEdges('classifier', routeToAgents, {
      location_agent: 'location_agent',
      item_agent: 'item_agent'
    })
    .addEdge('location_agent', END)
    .addEdge('item_agent', END)
    .compile()
}


// Routing function based on structured classifier output
function routeToAgents(state: typeof MessagesAnnotation.State): string {
  const lastMessage = state.messages[state.messages.length - 1]

  try {
    // Parse the structured classifier output
    const classifierOutput: ClassifierOutput = JSON.parse(lastMessage.content as string)

    // For now, just return the first selected agent
    // TODO: Handle multiple agents in parallel
    if (classifierOutput.selected_agents.length > 0) {
      const selectedAgentId = classifierOutput.selected_agents[0].agent_id

      // Map agent IDs to graph node names
      const agentMapping: Record<string, string> = {
        stone_chamber: 'location_agent',
        rusty_key: 'item_agent'
      }

      return agentMapping[selectedAgentId] || 'location_agent'
    }
  } catch (error) {
    console.warn('Failed to parse classifier output, falling back to default routing')
  }

  // Default fallback
  return 'location_agent'
}

