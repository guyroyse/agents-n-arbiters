import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph'
import { classifier, type ClassifierOutput } from './classifier.js'
import { locationAgent } from './location-agent.js'
import { fixtureAgent } from './fixture-agent.js'
import { agentInputFilter } from './agent-input-filter.js'
import { arbiter } from './arbiter.js'
import { LocationEntity, FixtureEntity, GameEntity, GameState } from '@domain/entities.js'

export class MultiAgentGraph {
  #graph: any
  #gameState: GameState

  constructor(gameState: GameState) {
    this.#graph = new StateGraph(MessagesAnnotation) as any
    this.#gameState = gameState
  }

  build() {
    this.#addClassifier()
    this.#addArbiter()
    this.#addAgents()

    return this.#graph.compile()
  }

  #addClassifier() {
    this.#graph.addNode('classifier', classifier(this.#gameState, 'classifier'))
    this.#graph.addEdge(START, 'classifier')
  }

  #addArbiter() {
    this.#graph.addNode('arbiter', arbiter(this.#gameState.gameId, 'arbiter'))
    this.#graph.addEdge('arbiter', END)
  }

  #addAgents() {
    const routingDestinations: Record<string, any> = {}

    const { gameId, entities } = this.#gameState

    for (const entity of entities) {
      const agentNodeName = entity.id
      const filterNodeName = `${agentNodeName}_filter`

      this.#addAgent(filterNodeName, agentNodeName, gameId, entity)

      routingDestinations[agentNodeName] = filterNodeName
    }

    routingDestinations['default'] = 'arbiter'

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

    return selectedAgents.length > 0 ? selectedAgents : ['default']
  }

  #addAgent(filterNodeName: string, agentNodeName: string, gameId: string, entity: GameEntity) {
    this.#addAgentFilter(filterNodeName, gameId, entity)
    this.#addAgentActual(agentNodeName, gameId, entity)

    this.#graph.addEdge(filterNodeName, agentNodeName)
    this.#graph.addEdge(agentNodeName, 'arbiter')
  }

  #addAgentFilter(filterNodeName: string, gameId: string, entity: GameEntity) {
    this.#graph.addNode(filterNodeName, agentInputFilter(gameId, entity, filterNodeName))
  }

  #addAgentActual(agentNodeName: string, gameId: string, entity: GameEntity) {
    switch (entity.constructor) {
      case LocationEntity:
        this.#addLocation(agentNodeName, gameId, entity as LocationEntity)
        break
      case FixtureEntity:
        this.#addFixture(agentNodeName, gameId, entity as FixtureEntity)
        break
      default:
        throw new Error(`Unknown entity type: ${entity.constructor.name}`)
    }
  }

  #addLocation(agentNodeName: string, gameId: string, entity: LocationEntity) {
    this.#graph.addNode(agentNodeName, locationAgent(gameId, entity, agentNodeName))
  }

  #addFixture(agentNodeName: string, gameId: string, entity: FixtureEntity) {
    this.#graph.addNode(agentNodeName, fixtureAgent(gameId, entity, agentNodeName))
  }
}
