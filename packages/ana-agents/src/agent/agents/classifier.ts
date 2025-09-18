import dedent from 'dedent'

import { fetchLLMClient } from '@ana/common'
import {
  GameTurnAnnotation,
  SelectedEntitiesSchema,
  type SelectedEntities
} from '../state/game-turn-state.js'
import type { GameState } from '@ana/domain'
import { log } from '@ana/common'

type ClassifierReturnType = Partial<typeof GameTurnAnnotation.State>

export async function classifier(state: typeof GameTurnAnnotation.State): Promise<ClassifierReturnType> {
  const gameState = state.gameState
  const userCommand = state.userCommand

  // Basic validation
  if (!userCommand) throw new Error('Missing user command')
  if (!gameState) throw new Error('Missing game state')

  // Extract useful data
  const { gameId } = gameState

  // Log input
  log(gameId, '🤖 CLASSIFIER - User command', userCommand)
  log(gameId, '🤖 CLASSIFIER - Game state', gameState)

  // Set up LLM with prompt and structured output
  const llm = await fetchLLMClient()
  const structuredLLM = llm.withStructuredOutput(SelectedEntitiesSchema)
  const prompt = buildClassifierPrompt(gameState, userCommand)
  log(gameId, '🤖 CLASSIFIER - Sending to LLM', prompt)

  // Invoke LLM and parse structured output
  const selection = (await structuredLLM.invoke(prompt)) as SelectedEntities
  log(gameId, '🤖 CLASSIFIER - LLM response', selection)

  // Return the structured output directly
  return { selectedEntities: selection.selectedAgents }
}

function buildClassifierPrompt(gameState: GameState, userCommand: string): string {
  const entitiesContext = JSON.stringify(gameState.nearbyEntities)

  return dedent`
    You are a CLASSIFIER in a multi-agent text adventure game system.

    TASK: Analyze the player command and select which game entities should be involved.
    - Each entity represents a specific object in the game world (locations, exits, fixtures, NPCs, player).
    - Select entities that should RESPOND to the command AND entities that might be AFFECTED by the action.

    Your goal is to SELECT all relevant entities for this command:
    1. RESPONDING entities: Those that can provide information about the command
    2. AFFECTED entities: Those whose state might change as a result of the action

    Provide brief REASONING for why each entity was selected.

    ANALYZE the player command and SELECT appropriate entities based on:
    - The available game entities (locations, exits, fixtures, NPCs)
    - Entity names, descriptions, current statuses, and available actions
    - Whether the command relates to specific entities or general exploration
    - Which entities can provide relevant responses for this command

    ENTITY TYPES:
    - Location entities: Handle general area descriptions and environmental details
    - Exit entities: Handle movement between locations (doors, passages, paths)
    - Fixture entities: Handle specific interactive objects (altars, levers, statues, etc.)
    - Player entities: Handle player character state, abilities, inventory, and self-examination
    - NPC entities: Handle character interactions and dialogue

    SELECTION GUIDELINES:
    - Location commands (look around, examine room, where am I, describe this place) → select location entities
    - Movement commands (go north, enter door, exit south) → select relevant exit entities
    - Exit queries (what exits, where does this lead, can I go there) → select exit entities
    - Specific object commands (examine altar, touch stone, use lever) → select those fixture entities
    - Action commands matching fixture actions (climb, activate, move) → select relevant fixture entities
    - Status queries (is it locked, what condition) → select relevant fixture/exit entities
    - General exploration (look around) → select location entities AND prominent fixture entities
    - Character interactions (talk to, ask about) → select relevant NPC entities
    - Player identity/character (who am I, what am I wearing, describe myself) → select player entities
    - Inventory commands (what do I have, what am I carrying, check inventory) → select player entities
    - Player physical status (am I hurt, what's my health, how do I feel physically) → select player entities
    - Character abilities (what are my skills, what abilities do I have) → select player entities
    - Meta-commands (help, inventory, quit, status) → select player entities if related to character state
    - Commands about non-existent things → select NO entities

    CROSS-ENTITY EFFECTS - Also select entities that might be affected:
    - Light/torch commands → select light source AND current location (lighting affects rooms)
    - Trap activation → select trap AND player (traps can injure or affect player)
    - Loud actions → select object AND location (noise affects environment)
    - Magical interactions → select magical object AND nearby entities (magic can have area effects)
    - Breaking/damaging → select object AND location (debris affects area)

    IMPORTANT DISTINCTIONS:
    - "Where am I?" = location query → select LOCATION entities (asking about current place/environment)
    - "Who am I?" = identity query → select PLAYER entities (asking about character identity/self)

    NEVER SELECT THE PLAYER ENTITY FOR COMMANDS ABOUT THE EXTERNAL WORLD, LOCATIONS, OR OBJECTS. YES,
    THE PLAYER ENTITY HAS A LOCATION ID. THAT DOES NOT MEAN IT SHOULD ANSWER QUESTIONS ABOUT THE LOCATION.

    OUTPUT: Return entity IDs that should respond, with brief reasoning for each selection.
    Be selective but thorough - include all entities that could provide useful context.

    AVAILABLE ENTITIES:
    ${entitiesContext}

    PLAYER COMMAND:
    ${userCommand}
  `
}
