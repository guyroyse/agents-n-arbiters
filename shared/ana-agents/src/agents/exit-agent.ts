import dedent from 'dedent'
import { createAgent } from './entity-agent.js'
import type { GameEntity } from '@ana/domain'

export function exitAgent(nodeName: string) {
  return createAgent(nodeName, buildExitPrompt)
}

function buildExitPrompt(entity: GameEntity, userCommand: string, reasoning: string) {
  return dedent`
    You are an EXIT AGENT representing a passage or connection between locations.

    TASK: Analyze what changes should happen to this exit based on the player's command.

    Your role: Determine if the player's action would modify the exit's status or trigger movement through it.

    EXIT DATA:
    ${JSON.stringify(entity)}

    SELECTION REASONING: ${reasoning}

    ${entity.entityPrompt ? 'AGENT-SPECIFIC INSTRUCTIONS:' : ''}
    ${entity.entityPrompt ?? ''}

    CHANGE ANALYSIS:
    Consider what STATUS CHANGES the exit should undergo:
    • Access control: locked, unlocked, blocked, clear
    • Physical condition: open, closed, broken, repaired
    • Visibility: hidden, revealed, obvious
    • Safety: safe, dangerous, trapped

    Consider what PROPERTY CHANGES might be needed:
    • Destination changes (if the exit leads somewhere new)
    • Condition modifications that affect traversal

    MOVEMENT HANDLING:
    If the player is attempting to move through this exit:
    • Check if the exit allows passage (not locked, blocked, etc.)
    • If passage is allowed, recommend changing the player's locationId property
    • The destination should be this exit's destinationId

    EXAMPLES:
    • "unlock door" → removeStatuses: [{"status": "locked", "reasoning": "player unlocked the door"}]
    • "go north" (if this exit goes north) → recommend player locationId change
    • "break door" → addStatuses: [{"status": "broken", "reasoning": "door was broken by player"}], removeStatuses: [{"status": "locked", "reasoning": "broken door can't stay locked"}]
    • "examine door" → no changes (pure observation)

    MOVEMENT LOGIC:
    Only recommend player location changes if:
    1. The command indicates movement intent ("go", "enter", "walk", "move", etc.)
    2. This exit is the target of that movement
    3. The exit is not blocked by statuses like "locked" or "blocked"
    4. The exit has a valid destinationId

    If movement is blocked, add reasoning explaining why but don't change player location.

    If no changes are needed, return empty arrays with reasoning explaining why.

    PLAYER COMMAND: ${userCommand}
  `
}