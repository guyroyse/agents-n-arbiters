import { Annotation } from '@langchain/langgraph'
import { z } from 'zod'
import type { BaseMessage } from '@langchain/core/messages'
import type { GameState } from '@domain/game-state.js'

export const SelectedEntityAgentsSchema = z.object({
  selectedAgents: z
    .array(
      z.object({
        entityId: z.string().describe('The entity ID this agent will represent'),
        reasoning: z.string().describe('One sentence why this specific entity is needed')
      })
    )
    .describe('Array of entity agents that should provide input for this command')
})

export const EntityAgentContributionSchema = z.object({
  entityId: z.string().describe('the entity ID that this contribution is from'),
  entityType: z.enum(['location', 'fixture', 'npc', 'exit']).describe('Type of entity providing this contribution'),
  content: z.string().describe("The entity agent's contribution to the game response")
})

export const ArbiterResponseSchema = z.object({
  content: z.string().describe('The final synthesized game narrative response to show the player')
})

export type SelectedEntityAgent = z.infer<typeof SelectedEntityAgentsSchema.shape.selectedAgents.element>
export type SelectedEntityAgents = z.infer<typeof SelectedEntityAgentsSchema>
export type EntityAgentContribution = z.infer<typeof EntityAgentContributionSchema>
export type ArbiterResponse = z.infer<typeof ArbiterResponseSchema>

/**
 * Game turn annotation for multi-agent text adventure processing.
 * Each channel handles a specific phase of processing a single game turn.
 */
export const GameTurnAnnotation = Annotation.Root({
  // 📥 INPUT PHASE - User's command for this turn
  userCommand: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null
  }),

  // 🎯 CONTEXT PHASE - Complete game state for this turn (immutable during turn)
  gameState: Annotation<GameState | null>({
    reducer: (_prev, next) => next,
    default: () => null
  }),

  // 🤖 CLASSIFICATION PHASE - Which agents should respond
  selectedAgents: Annotation<SelectedEntityAgent[]>({
    reducer: (_prev, next) => next,
    default: () => []
  }),

  // 🎭 AGENT PHASE - Individual agent contributions (accumulates as agents complete)
  agentContributions: Annotation<EntityAgentContribution[] | EntityAgentContribution>({
    reducer: (prev, next) => {
      const result = []
      Array.isArray(prev) ? result.push(...prev) : result.push(prev)
      Array.isArray(next) ? result.push(...next) : result.push(next)
      return result
    },
    default: () => []
  }),

  // ⚖️ ARBITER PHASE - Final synthesized game response
  arbiterResponse: Annotation<ArbiterResponse | null>({
    reducer: (_prev, next) => next,
    default: () => null
  }),

  // 📝 DEBUG PHASE - Raw messages for debugging (optional)
  debugMessages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => (Array.isArray(next) ? [...prev, ...next] : [...prev, next]),
    default: () => []
  })
})
