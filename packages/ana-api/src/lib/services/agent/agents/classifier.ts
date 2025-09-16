import dedent from 'dedent'

import { fetchLLMClient } from '@clients/llm-client.js'
import {
  GameTurnAnnotation,
  SelectedEntityAgentsSchema,
  type SelectedEntityAgents
} from '@services/agent/state/game-turn-state.js'
import type { GameState } from '@domain/game-state.js'
import { log } from '@utils'

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
  const structuredLLM = llm.withStructuredOutput(SelectedEntityAgentsSchema)
  const prompt = buildClassifierPrompt(gameState, userCommand)
  log(gameId, '🤖 CLASSIFIER - Sending to LLM', prompt)

  // Invoke LLM and parse structured output
  const selection = (await structuredLLM.invoke(prompt)) as SelectedEntityAgents
  log(gameId, '🤖 CLASSIFIER - LLM response', selection)

  // Return the structured output directly
  return { selectedAgents: selection.selectedAgents }
}

function buildClassifierPrompt(gameState: GameState, userCommand: string): string {
  const entitiesContext = JSON.stringify(gameState.nearbyEntities)

  return dedent`
    You are a CLASSIFIER in a multi-agent text adventure game system.

    TASK: Analyze the player command and select which game agents should respond.
    - Each game agent represents a specific entity in the game world (like locations, exits, fixtures, NPCs).
    - Each agent can provide unique, relevant information based on their entity's data.
    - The word agent and entity are used interchangeably here.

    Your goal is to SELECT the most relevant agents to handle the player's command,
    providing brief REASONING for why each agent was selected.

    ANALYZE the player command and SELECT appropriate agents based on:
    - The available game entities (locations, exits, fixtures, NPCs)
    - Entity names, descriptions, current statuses, and available actions
    - Whether the command relates to specific entities or general exploration
    - Which agents can provide relevant responses for this command

    ENTITY TYPES:
    - Location agents: Handle general area descriptions and environmental details
    - Exit agents: Handle movement between locations (doors, passages, paths)
    - Fixture agents: Handle specific interactive objects (altars, levers, statues, etc.)
    - Player agents: Handle player character state, abilities, inventory, and self-examination
    - NPC agents: Handle character interactions and dialogue

    SELECTION GUIDELINES:
    - Location commands (look around, examine room, where am I, describe this place) → select location agents
    - Movement commands (go north, enter door, exit south) → select relevant exit agents
    - Exit queries (what exits, where does this lead, can I go there) → select exit agents
    - Specific object commands (examine altar, touch stone, use lever) → select those fixture agents
    - Action commands matching fixture actions (climb, activate, move) → select relevant fixture agents
    - Status queries (is it locked, what condition) → select relevant fixture/exit agents
    - General exploration (look around) → select location agents AND prominent fixture agents
    - Character interactions (talk to, ask about) → select relevant NPC agents
    - Player identity/character (who am I, what am I wearing, describe myself) → select player agents
    - Inventory commands (what do I have, what am I carrying, check inventory) → select player agents
    - Player physical status (am I hurt, what's my health, how do I feel physically) → select player agents
    - Character abilities (what are my skills, what abilities do I have) → select player agents
    - Meta-commands (help, inventory, quit, status) → select player agents if related to character state
    - Commands about non-existent things → select NO agents

    IMPORTANT DISTINCTIONS:
    - "Where am I?" = location query → select LOCATION agents (asking about current place/environment)
    - "Who am I?" = identity query → select PLAYER agents (asking about character identity/self)

    NEVER SELECT THE PLAYER AGENT FOR COMMANDS ABOUT THE EXTERNAL WORLD, LOCATIONS, OR OBJECTS. YES,
    THE PLAYER AGENT HAS A LOCATION ID. THAT DOES NOT MEAN IT SHOULD ANSWER QUESTIONS ABOUT THE LOCATION.

    OUTPUT: Return agent IDs that should respond, with brief reasoning for each selection.
    Be selective but thorough - include all agents that could provide useful context.

    AVAILABLE ENTITIES:
    ${entitiesContext}

    PLAYER COMMAND:
    ${userCommand}
  `
}
