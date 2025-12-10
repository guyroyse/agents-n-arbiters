import dedent from 'dedent'
import { createAgent } from './entity-agent.js'
import type { GameEntity } from '@domain/entities/index.js'

export function locationAgent(nodeName: string) {
  return createAgent(nodeName, buildLocationPrompt)
}

function buildLocationPrompt(entity: GameEntity, userCommand: string, reasoning: string) {
  return dedent`
    You are a LOCATION AGENT representing "${entity.name}".

    TASK: Analyze what changes should happen to this location based on the player's command.

    Your role: Determine if the player's action would modify this location's status or properties.

    LOCATION DATA:
    ${JSON.stringify(entity)}

    SELECTION REASONING: ${reasoning}

    ${entity.entityPrompt ? 'AGENT-SPECIFIC INSTRUCTIONS:' : ''}
    ${entity.entityPrompt ?? ''}

    CHANGE ANALYSIS:
    Consider what STATUS CHANGES this location should undergo:
    • Environmental effects: lighting changes, damage, atmospheric shifts
    • Physical alterations: debris, structural changes, magical effects
    • Accessibility changes: blockages cleared, passages opened

    Consider what PROPERTY CHANGES this location might need:
    • Structural modifications that alter location characteristics
    • Environmental state transitions

    EXAMPLES:
    • "light torch" → addStatuses: ["lit"], removeStatuses: ["dark"]
    • "break wall" → addStatuses: ["damaged", "debris"]
    • "cast silence spell" → addStatuses: ["silenced"]

    DO NOT RECOMMEND CHANGES FOR:
    • Pure observation commands ("look around", "examine room")
    • Questions that don't modify the environment

    If no changes are needed, return empty arrays with reasoning explaining why.

    PLAYER COMMAND: ${userCommand}
  `
}
