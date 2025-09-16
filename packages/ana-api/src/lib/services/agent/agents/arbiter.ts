import dedent from 'dedent'
import { fetchLLMClient } from '@clients/llm-client.js'
import { log } from '@utils'
import {
  GameTurnAnnotation,
  ArbiterResponseSchema,
  type EntityAgentContribution,
  type ArbiterResponse
} from '@services/agent/state/game-turn-state.js'

type ArbiterReturnType = Partial<typeof GameTurnAnnotation.State>

export async function arbiter(state: typeof GameTurnAnnotation.State): Promise<ArbiterReturnType> {
  const gameState = state.gameState
  const userCommand = state.userCommand
  const agentContributions = state.agentContributions as EntityAgentContribution[]

  // Basic validation
  if (!gameState) throw new Error('Missing game state')
  if (!userCommand) throw new Error('Missing user command')

  // Extract useful data
  const { gameId } = gameState

  // Log input
  log(gameId, '⚖️  ARBITER - User command', userCommand)
  log(gameId, '⚖️  ARBITER - Agent contributions', agentContributions)

  // Set up LLM with prompt and structured output
  const llm = await fetchLLMClient()
  const structuredLLM = llm.withStructuredOutput(ArbiterResponseSchema)
  const prompt = buildArbiterPrompt(userCommand, agentContributions)
  log(gameId, '⚖️  ARBITER - Sending to LLM', prompt)

  // Invoke LLM and parse structured output
  const arbiterResponse = (await structuredLLM.invoke(prompt)) as ArbiterResponse
  log(gameId, '⚖️  ARBITER - LLM response', arbiterResponse)

  // Return the structured output directly
  return { arbiterResponse }
}

function buildArbiterPrompt(userCommand: string, agentContributions: EntityAgentContribution[]) {
  return dedent`
    You are the ARBITER in a multi-agent text adventure game system.
    
    TASK: Synthesize agent responses into a concise, engaging game narrative.
    
    Your role as Arbiter:
    - Combine insights from multiple agents into one cohesive response
    - Create the final response that the player will see
    - Maintain text adventure game tone and immersive storytelling
    - Weave agent inputs together naturally without revealing the multi-agent structure
    
    Guidelines:
    - Keep responses brief and focused
    - If only one agent responded, enhance and polish their response concisely
    - If multiple agents responded, synthesize them into a unified, terse narrative
    - If no agents responded (empty agent contributions), the command was about things NOT in the scene:
      * For help requests: Provide brief gameplay instructions (examine, look, go, take, etc.)
      * For actions on non-existent items (take sword, examine book, etc.): "You don't see that here."
      * For movement to non-existent exits (go north, enter cave, etc.): "You can't go that way."
      * For invalid game commands: "That isn't a valid action."
      * For abstract questions: "You can't do that right now."
      * IMPORTANT: Never allow actions on items/locations that agents didn't mention
      * Keep these responses very brief and direct
    - Always respond as the omniscient game narrator
    - Only provide detailed descriptions when the player specifically asks for them
    - Focus on immediate, actionable information over atmospheric flourishes

    PLAYER COMMAND:
    ${userCommand}

    AGENT CONTRIBUTIONS:
    ${JSON.stringify(agentContributions)}
  `
}
