import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph'
import { classifier, type ClassifierOutput } from './classifier.js'
import { locationAgent } from './location-agent.js'
import { fixtureAgent } from './fixture-agent.js'
import { agentInputFilter } from './agent-input-filter.js'
import { arbiter } from './arbiter.js'
import { fetchGameEntities, LocationEntity, FixtureEntity, GameEntity, type GameEntities } from '@domain/entities.js'

export async function buildMultiAgentGraph() {
  const gameEntities = await fetchGameEntities()
  const multiAgentGraph = new MultiAgentGraph(gameEntities)
  return multiAgentGraph.build()
}

class MultiAgentGraph {
  #graph: any
  #gameEntities: GameEntities

  constructor(gameEntities: GameEntities) {
    this.#graph = new StateGraph(MessagesAnnotation) as any
    this.#gameEntities = gameEntities
  }

  build() {
    this.#addClassifier()
    this.#addArbiter()
    this.#addAgents()

    return this.#graph.compile()
  }

  #addClassifier() {
    this.#graph.addNode('classifier', classifier(this.#gameEntities, 'classifier'))
    this.#graph.addEdge(START, 'classifier')
  }

  #addArbiter() {
    this.#graph.addNode('arbiter', arbiter('arbiter'))
    this.#graph.addEdge('arbiter', END)
  }

  #addAgents() {
    const routingDestinations: Record<string, any> = {}

    for (const entity of this.#gameEntities) {
      const agentNodeName = entity.id
      const filterNodeName = `${agentNodeName}_filter`

      this.#addAgent(filterNodeName, agentNodeName, entity)

      routingDestinations[agentNodeName] = filterNodeName
    }

    routingDestinations['arbiter'] = 'arbiter'

    this.#graph.addConditionalEdges(
      'classifier',
      (state: typeof MessagesAnnotation.State) => this.#routeToAgents(state),
      routingDestinations
    )
  }

  #routeToAgents(state: typeof MessagesAnnotation.State): string[] {
    const classifierMessage = state.messages[state.messages.length - 1]
    const classifierJson = classifierMessage.content as string
    const classifierOutput: ClassifierOutput = JSON.parse(classifierJson)

    const selectedAgents = classifierOutput.selected_agents.map(agent => agent.agent_id)

    return selectedAgents.length > 0 ? selectedAgents : ['arbiter']
  }

  #addAgent(filterNodeName: string, agentNodeName: string, entity: GameEntity) {
    this.#addAgentFilter(filterNodeName, entity.id)
    this.#addAgentActual(agentNodeName, entity)

    this.#graph.addEdge(filterNodeName, agentNodeName)
    this.#graph.addEdge(agentNodeName, 'arbiter')
  }

  #addAgentFilter(filterNodeName: string, entityId: string) {
    this.#graph.addNode(filterNodeName, agentInputFilter(entityId, filterNodeName))
  }

  #addAgentActual(agentNodeName: string, entity: GameEntity) {
    switch (entity.constructor) {
      case LocationEntity:
        this.#addLocation(agentNodeName, entity as LocationEntity)
        break
      case FixtureEntity:
        this.#addFixture(agentNodeName, entity as FixtureEntity)
        break
      default:
        throw new Error(`Unknown entity type: ${entity.constructor.name}`)
    }
  }

  #addLocation(agentNodeName: string, entity: LocationEntity) {
    this.#graph.addNode(agentNodeName, locationAgent(entity, agentNodeName))
  }

  #addFixture(agentNodeName: string, entity: FixtureEntity) {
    this.#graph.addNode(agentNodeName, fixtureAgent(entity, agentNodeName))
  }
}
