import { Annotation } from '@langchain/langgraph'
import { z } from 'zod'

import type { GameState } from '@domain/game-state.js'

/* 🤖 Classifier outputs */
export const SelectedEntitiesSchema = z.object({
  selectedAgents: z
    .array(
      z.object({
        entityId: z.string().describe('The ID of the selected entity'),
        reasoning: z.string().describe('One sentence why this specific entity is needed')
      })
    )
    .describe('Array of entities that should provide input for or are affected by this command')
})

export type SelectedEntity = z.infer<typeof SelectedEntitiesSchema.shape.selectedAgents.element>
export type SelectedEntities = z.infer<typeof SelectedEntitiesSchema>

/* 🎭 Entity agent narrative and change outputs */
export const EntityNarrativeSchema = z.object({
  entityId: z.string().describe('The entity ID that this narrative is from'),
  entityType: z
    .enum(['player', 'location', 'fixture', 'item', 'npc', 'exit'])
    .describe('Type of entity providing this narrative'),
  content: z.string().describe("The entity's narrative contribution to the game response")
})

export const EntityRecommendationSchema = z.object({
  entityId: z.string().describe('The entity ID that this recommendation is from'),
  entityType: z
    .enum(['player', 'location', 'fixture', 'item', 'npc', 'exit'])
    .describe('Type of entity providing this recommendation'),
  recommendedChanges: z
    .array(
      z.object({
        change: z.string().describe('Description of the recommended status change to this entity'),
        reasoning: z.string().describe('Why this change should happen based on the player command')
      })
    )
    .describe('Array of recommended status changes for this entity')
})

export const EntityAgentResponseSchema = z.object({
  narrative: EntityNarrativeSchema.describe('Narrative contribution for storytelling'),
  recommendation: EntityRecommendationSchema.describe('State change recommendations')
})

export type EntityNarrative = z.infer<typeof EntityNarrativeSchema>
export type EntityRecommendation = z.infer<typeof EntityRecommendationSchema>
export type EntityAgentResponse = z.infer<typeof EntityAgentResponseSchema>

/* ⚖️ Arbiter outputs */
export const ApprovedChangeSchema = z.object({
  entityId: z.string().describe('The entity ID that should be changed'),
  entityType: z.string().describe('The type of entity being changed'),
  statusesAdded: z.array(z.string()).describe('Statuses to add to this entity'),
  statusesRemoved: z.array(z.string()).describe('Statuses to remove from this entity'),
  reasoning: z.string().describe('Why this change was approved by the arbiter')
})

export const ArbiterResponseSchema = z.object({
  approvedChanges: z.array(ApprovedChangeSchema).describe('State changes approved by the arbiter')
})

export type ApprovedChange = z.infer<typeof ApprovedChangeSchema>
export type ArbiterResponse = z.infer<typeof ArbiterResponseSchema>

/* 📝 Committer outputs */
export const FinalNarrativeSchema = z.object({
  finalNarrative: z.string().describe('The final narrative response combining all approved changes into a cohesive story')
})

export type FinalNarrative = z.infer<typeof FinalNarrativeSchema>

/**
 * Game turn annotation for multi-agent text adventure processing.
 * Each channel handles a specific phase of processing a single game turn.
 */
export const GameTurnAnnotation = Annotation.Root({
  userCommand: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null
  }),

  gameState: Annotation<GameState | null>({
    reducer: (_prev, next) => next,
    default: () => null
  }),

  selectedEntities: Annotation<SelectedEntity[]>({
    reducer: (_prev, next) => next,
    default: () => []
  }),

  agentNarratives: Annotation<EntityNarrative[] | EntityNarrative>({
    reducer: (prev, next) => {
      const result = []
      Array.isArray(prev) ? result.push(...prev) : result.push(prev)
      Array.isArray(next) ? result.push(...next) : result.push(next)
      return result
    },
    default: () => []
  }),

  agentRecommendations: Annotation<EntityRecommendation[] | EntityRecommendation>({
    reducer: (prev, next) => {
      const result = []
      Array.isArray(prev) ? result.push(...prev) : result.push(prev)
      Array.isArray(next) ? result.push(...next) : result.push(next)
      return result
    },
    default: () => []
  }),

  approvedChanges: Annotation<ApprovedChange[]>({
    reducer: (_prev, next) => next,
    default: () => []
  }),

  finalNarrative: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null
  })
})
