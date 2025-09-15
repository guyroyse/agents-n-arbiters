import dedent from 'dedent'

import { fetchLLMClient } from '@clients/llm-client.js'
import { GameTurnAnnotation, ClassifierSelectionSchema, type ClassifierSelection } from './game-turn-state.js'
import type { GameState } from '@domain/entities.js'
import { log, toPrettyJsonString } from '@utils'

export async function classifier(state: typeof GameTurnAnnotation.State) {
  const gameState = state.game_state
  const userCommand = state.user_command

  // Basic validation
  if (!userCommand) throw new Error('Missing user command')
  if (!gameState) throw new Error('Missing game state')

  // Log input
  log(gameState.gameId, '🤖 CLASSIFIER', `Processing command: ${userCommand}`)
  log(gameState.gameId, '🤖 CLASSIFIER', `Available entities: ${gameState.entities.map(e => e.id).join(', ')}`)

  // Set up LLM with prompt and structured output
  const llm = await fetchLLMClient()
  const structuredLLM = llm.withStructuredOutput(ClassifierSelectionSchema)
  const prompt = buildClassifierPrompt(gameState, userCommand)
  log(gameState.gameId, '🤖 CLASSIFIER', 'Sending to LLM')

  // Invoke LLM and parse structured output
  const selection = (await structuredLLM.invoke(prompt)) as ClassifierSelection
  log(gameState.gameId, '🤖 CLASSIFIER', selection)

  // Return the structured output directly
  return { agent_selection: selection }
}

function buildClassifierPrompt(gameState: GameState, userCommand: string) {
  const entitiesContext = toPrettyJsonString(gameState.entities)

  return dedent`
    You are a CLASSIFIER in a multi-agent text adventure game system.

    TASK: Analyze the player command and select which game agents should respond.

    ANALYZE the player command and SELECT appropriate agents based on:
    - The available game entities (locations, exits, fixtures, NPCs)
    - Entity names, descriptions, current statuses, and available actions
    - Whether the command relates to specific entities or general exploration
    - Which agents can provide relevant responses for this command

    ENTITY TYPES:
    - Location agents: Handle general area descriptions and environmental details
    - Exit agents: Handle movement between locations (doors, passages, paths)
    - Fixture agents: Handle specific interactive objects (altars, levers, statues, etc.)
    - NPC agents: Handle character interactions and dialogue

    SELECTION GUIDELINES:
    - Location commands (look around, examine room, where am I) → select location agents
    - Movement commands (go north, enter door, exit south) → select relevant exit agents
    - Exit queries (what exits, where does this lead, can I go there) → select exit agents
    - Specific object commands (examine altar, touch stone, use lever) → select those fixture agents
    - Action commands matching fixture actions (climb, activate, move) → select relevant fixture agents
    - Status queries (is it locked, what condition) → select relevant fixture/exit agents
    - General exploration (look around) → select location agents AND prominent fixture agents
    - Character interactions (talk to, ask about) → select relevant NPC agents
    - Meta-commands (help, inventory, quit, status) → select NO agents
    - Commands about non-existent things → select NO agents

    OUTPUT: Return agent IDs that should respond, with brief reasoning for each selection.
    Be selective but thorough - include all agents that could provide useful context.

    AVAILABLE ENTITIES:
    ${entitiesContext}

    PLAYER COMMAND:
    ${userCommand}
  `
}
