import { fetchLLMClient } from '@ana/common/clients'
import { log } from '@ana/common/utils'
import {
  GameTurnAnnotation,
  EntityAgentResponseSchema,
  type EntityAgentResponse,
  type SelectedEntity
} from '@/game-turn-state.js'
import type { GameEntity } from '@ana/domain'

const agentLabels: Record<string, string> = {
  player: '🧑 PLAYER AGENT',
  location: '🏛️ LOCATION AGENT',
  fixture: '🗿 FIXTURE AGENT',
  item: '📦 ITEM AGENT',
  npc: '👤 NPC AGENT',
  exit: '🚪 EXIT AGENT'
}

const unknownAgent = '❓ UNKNOWN AGENT'

type AgentReturnType = Partial<typeof GameTurnAnnotation.State>

export function createAgent(
  nodeName: string,
  promptBuilder: (entity: GameEntity, userCommand: string, reasoning: string) => string
) {
  const entityId = nodeName

  return async function (state: typeof GameTurnAnnotation.State): Promise<AgentReturnType> {
    const gameState = state.gameState
    const userCommand = state.userCommand
    const selections = state.selectedEntities as SelectedEntity[]

    // Basic validation
    if (!gameState) throw new Error('Missing game state')
    if (!userCommand) throw new Error('Missing user command')

    // Extract useful data
    const { gameId, nearbyEntities } = gameState

    // Find my entity data
    const entity = nearbyEntities.find(entity => entity.entityId === entityId)
    if (!entity) throw new Error(`Entity not found for node: ${nodeName}`)

    // Get agent label from entity type
    const agentLabel = `${agentLabels[entity.entityType] ?? unknownAgent} (${entity.entityId})`

    // Find classifier reasoning for selecting me
    const selection = selections.find((selection: SelectedEntity) => selection.entityId === entityId)
    const reasoning = selection?.reasoning ?? 'No reasoning provided'

    // Log input
    log(gameId, `${agentLabel} - User command`, userCommand)
    log(gameId, `${agentLabel} - Entity`, entity)
    log(gameId, `${agentLabel} - Entity prompt`, entity.entityPrompt ?? 'None')
    log(gameId, `${agentLabel} - Reasoning`, reasoning)

    // Set up LLM with prompt and structured output
    const llm = await fetchLLMClient()
    const structuredLLM = llm.withStructuredOutput(EntityAgentResponseSchema)
    const prompt = promptBuilder(entity, userCommand, reasoning)
    log(gameId, `${agentLabel} - Sending to LLM`, prompt)

    // Invoke LLM and parse structured output
    const agentResponse = (await structuredLLM.invoke(prompt)) as EntityAgentResponse
    log(gameId, `${agentLabel} - LLM response`, agentResponse)

    // Return narrative and recommendations to separate channels
    return {
      agentNarratives: agentResponse.narrative,
      agentRecommendations: agentResponse.recommendation
    }
  }
}
