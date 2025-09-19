import { Annotation } from '@langchain/langgraph'
import { z } from 'zod'

import type { GameState } from '@ana/domain'

/* 🤖 Classifier outputs */
export const SelectedEntitiesSchema = z.object({
  selectedEntities: z
    .array(
      z.object({
        entityId: z.string().describe('The ID of the selected entity'),
        reasoning: z.string().describe('One sentence describing what might change about this entity')
      })
    )
    .describe('Array of entities whose state might be changed by this command')
})

export type SelectedEntity = z.infer<typeof SelectedEntitiesSchema.shape.selectedEntities.element>
export type SelectedEntities = z.infer<typeof SelectedEntitiesSchema>

/* 🎭 Entity agent change recommendation outputs */
export const EntityChangeRecommendationSchema = z.object({
  entityId: z.string().describe('The entity ID that this change recommendation is from'),
  entityType: z
    .enum(['player', 'location', 'fixture', 'item', 'npc', 'exit'])
    .describe('Type of entity providing this change recommendation'),
  addStatuses: z
    .array(
      z.object({
        status: z.string().describe('Status to add to this entity'),
        reasoning: z.string().describe('Why this status should be added')
      })
    )
    .describe('Statuses to add to this entity'),
  removeStatuses: z
    .array(
      z.object({
        status: z.string().describe('Status to remove from this entity'),
        reasoning: z.string().describe('Why this status should be removed')
      })
    )
    .describe('Statuses to remove from this entity'),
  setProperties: z
    .array(
      z.object({
        property: z.string().describe('Property name to set on this entity'),
        value: z.string().describe('Value to set for this property'),
        reasoning: z.string().describe('Why this property should be changed')
      })
    )
    .describe('Properties to set on this entity'),
  reasoning: z.string().describe('Overall reasoning for these change recommendations')
})

export type EntityChangeRecommendation = z.infer<typeof EntityChangeRecommendationSchema>

/* ⚖️ Arbiter outputs */
export const EntityChangesSchema = z.object({
  entityChanges: z
    .array(
      z.object({
        entityId: z.string().describe('The entity ID that should be changed'),
        entityType: z.string().describe('The type of entity being changed'),
        addStatuses: z
          .array(
            z.object({
              status: z.string().describe('Status to add to this entity'),
              reasoning: z.string().describe('Why this status addition should happen')
            })
          )
          .describe('Statuses to add to this entity'),
        removeStatuses: z
          .array(
            z.object({
              status: z.string().describe('Status to remove from this entity'),
              reasoning: z.string().describe('Why this status removal should happen')
            })
          )
          .describe('Statuses to remove from this entity'),
        setProperties: z
          .array(
            z.object({
              property: z.string().describe('Property name to set on this entity'),
              value: z.string().describe('Value to set for this property'),
              reasoning: z.string().describe('Why this property change should happen')
            })
          )
          .describe('Properties to set on this entity'),
        reasoning: z.string().describe('Overall reasoning for these changes')
      })
    )
    .describe('Array of entity changes determined by the arbiter')
})

export type EntityStatusAddition = z.infer<
  typeof EntityChangesSchema.shape.entityChanges.element.shape.addStatuses.element
>
export type EntityStatusRemoval = z.infer<
  typeof EntityChangesSchema.shape.entityChanges.element.shape.removeStatuses.element
>
export type EntityPropertyChange = z.infer<
  typeof EntityChangesSchema.shape.entityChanges.element.shape.setProperties.element
>
export type EntityChange = z.infer<typeof EntityChangesSchema.shape.entityChanges.element>
export type EntityChanges = z.infer<typeof EntityChangesSchema>

/* 📝 Committer outputs */
export const FinalNarrativeSchema = z.object({
  finalNarrative: z
    .string()
    .describe('The final narrative response combining all approved changes into a cohesive story')
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

  entityChangeRecommendations: Annotation<EntityChangeRecommendation[] | EntityChangeRecommendation>({
    reducer: (prev, next) => {
      const result = []
      Array.isArray(prev) ? result.push(...prev) : result.push(prev)
      Array.isArray(next) ? result.push(...next) : result.push(next)
      return result
    },
    default: () => []
  }),

  entityChanges: Annotation<EntityChange[]>({
    reducer: (_prev, next) => next,
    default: () => []
  }),

  finalNarrative: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null
  })
})
