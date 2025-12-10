import dedent from 'dedent'

import { fetchLLMClient } from '@clients/index.js'
import { GameTurnAnnotation, SelectedEntitiesSchema, type SelectedEntities } from '../game-turn-state.js'
import type { GameState } from '@domain/game-state.js'
import { log } from '@utils/logger-utils.js'

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
  return { selectedEntities: selection.selectedEntities }
}

function buildClassifierPrompt(gameState: GameState, userCommand: string): string {
  return dedent`
    You are a CLASSIFIER in a multi-agent text adventure game system.

    Your role: Identify which entities need to analyze potential state or property changes for this command.

    WHAT CONSTITUTES A CHANGE:
    Any modification to entity data - statuses, properties, attributes, or relationships.

    SELECTION CRITERIA:
    Select entities ONLY if the player action could modify their:
    - Status flags (locked → unlocked, lit → unlit, broken, hidden, etc.)
    - Properties (location, ownership, destination, condition, etc.)
    - Attributes (health, inventory, relationships, abilities, etc.)

    COMMON CHANGE PATTERNS:
    • Movement: "go north" → EXIT entity (changes player.locationId property)
    • Interaction: "unlock door" → EXIT entity (removes "locked" status)
    • Object use: "light torch" → FIXTURE entity (adds "lit" status)
    • Inventory: "take sword" → PLAYER + ITEM entities (ownership transfer)
    • Social: "attack goblin" → NPC + PLAYER entities (health, relationship changes)

    OBSERVATIONAL COMMANDS (select NO entities):
    • "look around", "examine", "describe", "where am I"
    • Pure information gathering without interaction

    CROSS-ENTITY EFFECTS:
    When actions affect multiple entities, select all that change:
    • "give sword to merchant" → ITEM (owner), PLAYER (inventory), NPC (inventory)
    • "break magical seal" → FIXTURE (status), LOCATION (protection), PLAYER (consequences)

    For each selected entity, explain what specific change might occur.

    AVAILABLE ENTITIES:
    ${JSON.stringify(gameState.nearbyEntities)}

    PLAYER COMMAND:
    ${userCommand}
  `
}
