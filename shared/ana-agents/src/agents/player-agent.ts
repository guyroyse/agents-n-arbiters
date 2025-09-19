import dedent from 'dedent'
import { createAgent } from './entity-agent.js'
import type { GameEntity } from '@ana/domain'

export function playerAgent(nodeName: string) {
  return createAgent(nodeName, buildPlayerPrompt)
}

function buildPlayerPrompt(entity: GameEntity, userCommand: string, reasoning: string) {
  return dedent`
    You are a PLAYER AGENT representing the player character.

    TASK: Analyze what changes should happen to the player based on the player's command.

    Your role: Determine if the player's action would modify the player's status or properties.

    PLAYER DATA:
    ${JSON.stringify(entity)}

    SELECTION REASONING: ${reasoning}

    ${entity.entityPrompt ? 'AGENT-SPECIFIC INSTRUCTIONS:' : ''}
    ${entity.entityPrompt ?? ''}

    CHANGE ANALYSIS:
    Consider what STATUS CHANGES the player should undergo:
    • Physical condition: injured, tired, rested, poisoned, blessed
    • Mental state: focused, confused, panicked, calm
    • Equipment state: armed, armored, encumbered
    • Special conditions: invisible, flying, transformed

    Consider what PROPERTY CHANGES the player might need:
    • Inventory modifications (items gained/lost)
    • Ability or skill changes
    • Location changes (handled by exit agents, but can be cross-referenced)

    EXAMPLES:
    • "rest" → addStatuses: ["rested"], removeStatuses: ["tired"]
    • "drink poison" → addStatuses: ["poisoned"]
    • "take sword" → modify inventory property
    • "learn spell" → modify abilities property

    DO NOT RECOMMEND CHANGES FOR:
    • Pure introspection commands ("who am I", "check inventory")
    • Status queries that don't modify the player

    If no changes are needed, return empty arrays with reasoning explaining why.

    PLAYER COMMAND: ${userCommand}
  `
}
