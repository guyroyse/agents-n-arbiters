import { StateGraph, START, END } from '@langchain/langgraph'
import { classifier } from './agents/classifier.js'
import { locationAgent } from './agents/location-agent.js'
import { fixtureAgent } from './agents/fixture-agent.js'
import { playerAgent } from './agents/player-agent.js'
import { arbiter } from './agents/arbiter.js'
import { committer } from './agents/committer.js'
import { LocationEntity, FixtureEntity, PlayerEntity, GameState } from '@ana/domain'
import { GameTurnAnnotation } from './game-turn-state.js'
import { log } from '@ana/common/utils'

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
    this.#addCommitter()
    this.#addAgents()

    return this.#graph.compile()
  }

  #addClassifier() {
    this.#graph.addNode('classifier', classifier)
    this.#graph.addEdge(START, 'classifier')
  }

  #addArbiter() {
    this.#graph.addNode('arbiter', arbiter)
    this.#graph.addEdge('arbiter', 'committer')
  }

  #addCommitter() {
    this.#graph.addNode('committer', committer)
    this.#graph.addEdge('committer', END)
  }

  #addAgents() {
    const routingDestinations: Record<string, any> = {}

    for (const entity of this.#gameState.nearbyEntities) {
      const nodeName = entity.entityId
      this.#addAgent(nodeName)
      this.#graph.addEdge(nodeName, 'arbiter')
      routingDestinations[nodeName] = nodeName
    }

    routingDestinations['default'] = 'arbiter'

    this.#graph.addConditionalEdges(
      'classifier',
      (state: typeof GameTurnAnnotation.State) => this.#routeToEntityAgents(state),
      routingDestinations
    )
  }

  #routeToEntityAgents(state: typeof GameTurnAnnotation.State): string[] {
    const selectedAgents = state.selectedEntities.map(entity => entity.entityId)
    log(this.#gameState.gameId, '🤖 CLASSIFIER selected agents:', selectedAgents)

    return selectedAgents.length > 0 ? selectedAgents : ['default']
  }

  #addAgent(nodeName: string) {
    const entity = this.#gameState.nearbyEntities.find(entity => entity.entityId === nodeName)
    if (!entity) throw new Error(`Entity not found for node: ${nodeName}`)

    switch (entity.constructor) {
      case LocationEntity:
        this.#graph.addNode(nodeName, locationAgent(nodeName))
        break
      case FixtureEntity:
        this.#graph.addNode(nodeName, fixtureAgent(nodeName))
        break
      case PlayerEntity:
        this.#graph.addNode(nodeName, playerAgent(nodeName))
        break
      default:
        throw new Error(`Unknown entity type: ${entity.constructor.name}`)
    }
  }
}
