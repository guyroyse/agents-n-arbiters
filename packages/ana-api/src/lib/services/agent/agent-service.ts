import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph'
import { HumanMessage } from '@langchain/core/messages'
import { classifier, type ClassifierOutput } from './classifier.js'
import { locationAgent } from './location-agent.js'
import { itemAgent } from './item-agent.js'
import { agentInputFilter } from './agent-input-filter.js'
import { arbiter } from './arbiter.js'
import { fetchAvailableAgents } from './available-agents.js'

// Simple function to process a command
export async function processCommand(command: string): Promise<string> {
  const graph = await buildGraph()

  const initialState = {
    messages: [new HumanMessage({ content: command })]
  }

  const result = await graph.invoke(initialState)

  const lastMessage = result.messages[result.messages.length - 1]
  return lastMessage.content as string
}

async function buildGraph() {
  const availableAgents = await fetchAvailableAgents()
  
  // Create a new graph with type assertion to handle dynamic nodes
  const graph = new StateGraph(MessagesAnnotation) as any
  
  graph.addNode('classifier', classifier)
  graph.addNode('arbiter', arbiter)
  graph.addEdge(START, 'classifier')

  // Build routing destinations for conditional edges
  const routingDestinations: Record<string, any> = {}

  // Add nodes for all available agents dynamically
  const allAgents = [
    ...availableAgents.location_agents,
    ...availableAgents.item_agents,
    ...availableAgents.npc_agents
  ]

  for (const agent of allAgents) {
    const filterNodeName = `${agent.id}_filter`
    const agentNodeName = agent.id

    // Add filter and agent nodes
    graph.addNode(filterNodeName, agentInputFilter(agent.id))
    
    // Map agent type to actual agent function
    if (availableAgents.location_agents.some(a => a.id === agent.id)) {
      graph.addNode(agentNodeName, locationAgent)
    } else if (availableAgents.item_agents.some(a => a.id === agent.id)) {
      graph.addNode(agentNodeName, itemAgent)
    }
    // TODO: Add NPC agents when implemented

    // Add edges: filter -> agent -> arbiter
    graph.addEdge(filterNodeName, agentNodeName)
    graph.addEdge(agentNodeName, 'arbiter')

    // Add to routing destinations
    routingDestinations[agentNodeName] = filterNodeName
  }

  // Add conditional edges and final edge
  graph.addConditionalEdges('classifier', routeToAgents, routingDestinations)
  graph.addEdge('arbiter', END)

  return graph.compile()
}


// Routing function based on structured classifier output
function routeToAgents(state: typeof MessagesAnnotation.State): string | string[] {
  const lastMessage = state.messages[state.messages.length - 1]

  try {
    // Parse the structured classifier output
    const classifierOutput: ClassifierOutput = JSON.parse(lastMessage.content as string)

    // Use agent IDs directly as node names
    if (classifierOutput.selected_agents.length > 0) {
      const selectedAgents = classifierOutput.selected_agents
        .map(agent => agent.agent_id)
        .filter(Boolean)

      // Return single agent or array for parallel execution
      return selectedAgents.length === 1 ? selectedAgents[0] : selectedAgents
    }
  } catch (error) {
    console.warn('Failed to parse classifier output, falling back to default routing')
  }

  // Default fallback - use first available agent ID
  return 'stone_chamber'
}


