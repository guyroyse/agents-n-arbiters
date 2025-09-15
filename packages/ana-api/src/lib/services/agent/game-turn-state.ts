import { Annotation } from '@langchain/langgraph'
import { z } from 'zod'
import type { BaseMessage } from '@langchain/core/messages'
import type { GameState } from '@domain/entities.js'

export const SelectedAgentSchema = z.object({
  agent_id: z.string().describe('ID from available agents list'),
  reasoning: z.string().describe('One sentence why this specific agent is needed')
})

export const ClassifierSelectionSchema = z.object({
  selected_agents: z.array(SelectedAgentSchema).describe('Array of agents that should provide input for this command')
})

export type SelectedAgent = z.infer<typeof SelectedAgentSchema>
export type ClassifierSelection = z.infer<typeof ClassifierSelectionSchema>

/**
 * Agent output structure for the game workflow
 */
export interface AgentOutput {
  agent_id: string
  agent_type: 'location' | 'fixture' | 'npc'
  content: string
  reasoning?: string
}

/**
 * Game turn annotation for multi-agent text adventure processing.
 * Each channel handles a specific phase of processing a single game turn.
 */
export const GameTurnAnnotation = Annotation.Root({
  // 📥 INPUT PHASE - User's command for this turn
  user_command: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null
  }),

  // 🎯 CONTEXT PHASE - Complete game state for this turn (immutable during turn)
  game_state: Annotation<GameState | null>({
    reducer: (_prev, next) => next,
    default: () => null
  }),

  // 🤖 CLASSIFICATION PHASE - Which agents should respond
  agent_selection: Annotation<ClassifierSelection | null>({
    reducer: (_prev, next) => next,
    default: () => null
  }),

  // 🎭 AGENT PHASE - Individual agent responses (accumulates as agents complete)
  agent_outputs: Annotation<AgentOutput[]>({
    reducer: (prev, next) => (Array.isArray(next) ? [...prev, ...next] : [...prev, next]),
    default: () => []
  }),

  // ⚖️ ARBITER PHASE - Final synthesized game response
  final_response: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null
  }),

  // 📝 DEBUG PHASE - Raw messages for debugging (optional)
  debug_messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => (Array.isArray(next) ? [...prev, ...next] : [...prev, next]),
    default: () => []
  })
})
