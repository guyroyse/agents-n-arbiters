import { StateGraph, START, END } from '@langchain/langgraph'
import { classifier } from './classifier.js'
import { locationAgent } from './location-agent.js'
import { fixtureAgent } from './fixture-agent.js'
import { arbiter } from './arbiter.js'
import { LocationEntity, FixtureEntity, GameState } from '@domain/entities.js'
import { GameTurnAnnotation } from './game-turn-state.js'
import { log } from '@utils'

export class MultiAgentGraph {
  #graph: any
  #gameState: GameState

  constructor(gameState: GameState) {
    this.#graph = new StateGraph(GameTurnAnnotation) as any
    this.#gameState = gameState
  }

  build() {
    this.#addClassifier()
    this.#addArbiter()
    this.#addAgents()

    return this.#graph.compile()
  }

  #addClassifier() {
    this.#graph.addNode('classifier', classifier)
    this.#graph.addEdge(START, 'classifier')
  }

  #addArbiter() {
    this.#graph.addNode('arbiter', arbiter(this.#gameState.gameId))
    this.#graph.addEdge('arbiter', END)
  }

  #addAgents() {
    const routingDestinations: Record<string, any> = {}

    for (const entity of this.#gameState.entities) {
      const nodeName = entity.id
      this.#addAgent(nodeName)
      this.#graph.addEdge(nodeName, 'arbiter')
      routingDestinations[nodeName] = nodeName
    }

    routingDestinations['default'] = 'arbiter'

    this.#graph.addConditionalEdges(
      'classifier',
      (state: typeof GameTurnAnnotation.State) => this.#routeToAgents(state),
      routingDestinations
    )
  }

  #routeToAgents(state: typeof GameTurnAnnotation.State): string[] {
    const selection = state.agent_selection
    if (!selection) return ['default']

    const selectedAgents = selection.selected_agents.map(agent => agent.agent_id)
    log(this.#gameState.gameId, '🤖 CLASSIFIER selected agents:', selectedAgents)

    return selectedAgents.length > 0 ? selectedAgents : ['default']
  }

  #addAgent(nodeName: string) {
    const entity = this.#gameState.entities.find(entity => entity.id === nodeName)
    if (!entity) throw new Error(`Entity not found for node: ${nodeName}`)

    switch (entity.constructor) {
      case LocationEntity:
        this.#graph.addNode(nodeName, locationAgent(nodeName))
        break
      case FixtureEntity:
        this.#graph.addNode(nodeName, fixtureAgent(nodeName))
        break
      default:
        throw new Error(`Unknown entity type: ${entity.constructor.name}`)
    }
  }
}
