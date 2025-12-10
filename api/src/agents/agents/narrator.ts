import dedent from 'dedent'

import { fetchLLMClient, readWorkingMemory, replaceWorkingMemory } from '@clients/index.js'
import { log } from '@utils/logger-utils.js'
import { GameTurnAnnotation, FinalNarrativeSchema, type FinalNarrative } from '../game-turn-state.js'
import type { GameState } from '@domain/game-state.js'
import type { WorkingMemory } from '@clients/ams-client.js'

type NarratorReturnType = Partial<typeof GameTurnAnnotation.State>

export async function narrator(state: typeof GameTurnAnnotation.State): Promise<NarratorReturnType> {
  const gameState = state.gameState
  const userCommand = state.userCommand
  const entityChanges = state.entityChanges

  // Basic validation
  if (!userCommand) throw new Error('Missing user command')
  if (!gameState) throw new Error('Missing game state')

  // Extract useful data
  const { gameId } = gameState

  // Log input
  log(gameId, '📖 NARRATOR - User command', userCommand)
  log(gameId, '📖 NARRATOR - Entity changes', entityChanges)

  // Get conversation history from AMS
  const narratorMemory = await readWorkingMemory(gameId, 'narrator')
  log(gameId, '📖 NARRATOR - Loaded memory', { messageCount: narratorMemory.messages.length })

  // Set up LLM with prompt and structured output
  const llm = await fetchLLMClient()
  const structuredLLM = llm.withStructuredOutput(FinalNarrativeSchema)
  const prompt = buildNarratorPrompt(gameState, userCommand, entityChanges, narratorMemory)
  log(gameId, '📖 NARRATOR - Sending to LLM', prompt)

  // Invoke LLM and parse structured output
  const narrative = (await structuredLLM.invoke(prompt)) as FinalNarrative
  log(gameId, '📖 NARRATOR - LLM response', narrative)

  // Save this turn to AMS memory
  const context = narratorMemory.context
  const messages = [
    ...narratorMemory.messages,
    { role: 'user', content: userCommand },
    { role: 'assistant', content: narrative.finalNarrative }
  ]
  await replaceWorkingMemory(gameId, 'narrator', context, messages)

  // Return the final narrative
  return { finalNarrative: narrative.finalNarrative }
}

function buildNarratorPrompt(
  gameState: GameState,
  userCommand: string,
  entityChanges: any[],
  narratorMemory: WorkingMemory
): string {
  return dedent`
    You are the NARRATOR in a multi-agent text adventure game system.

    Your role: Create a cohesive, immersive narrative response that incorporates all the changes that have been applied to the game world.

    TASK: Transform the structured entity changes into engaging storytelling that feels natural and immersive.

    NARRATIVE PRINCIPLES:
    • Write in second person ("You do this", "You see that")
    • Focus on atmospheric description and sensory details
    • Make the player feel present in the game world
    • Incorporate all applied changes smoothly into the story
    • Maintain consistency with the game's tone and setting

    CHANGE INTEGRATION:
    • Status additions/removals: Describe the transition naturally
    • Property changes: Show the effects in the narrative
    • Multiple entity changes: Weave them together coherently
    • No changes: Still provide engaging descriptive response

    STYLE GUIDELINES:
    • Keep responses SHORT and focused (1-2 sentences for simple actions, max 1 paragraph for complex ones)
    • Be direct and concise while maintaining atmosphere
    • For observational commands ("look", "where am I"), give brief, clear descriptions
    • For actions with changes, describe the immediate result simply
    • Avoid flowery language and excessive detail
    • ALWAYS include the current location name and available exits in your response
    • Format exits as "Exits: [direction] to [location]" or similar natural phrasing

    GAME ENTITIES:
    ${JSON.stringify(gameState.nearbyEntities)}
    
    RECENT MEMORY:
    • Summary: ${narratorMemory.context ? narratorMemory.context : 'No summary available'}
    ${narratorMemory.messages.map(message => `• ${message.role.toUpperCase()}: ${message.content}`).join('\n')}

    APPLIED CHANGES:
    ${JSON.stringify(entityChanges)}

    PLAYER COMMAND: ${userCommand}

  `
}
