import dedent from 'dedent'
import { fetchLLMClient } from '@ana/common/clients'
import { log } from '@ana/common/utils'
import { GameTurnAnnotation, FinalNarrativeSchema, type EntityNarrative, type ApprovedChange, type FinalNarrative } from '../state/game-turn-state.js'

type CommitterReturnType = Partial<typeof GameTurnAnnotation.State>

export async function committer(state: typeof GameTurnAnnotation.State): Promise<CommitterReturnType> {
  const gameState = state.gameState
  const userCommand = state.userCommand
  const approvedChanges = state.approvedChanges as ApprovedChange[]
  const agentNarratives = state.agentNarratives as EntityNarrative[]

  // Basic validation
  if (!userCommand) throw new Error('Missing user command')
  if (!gameState) throw new Error('Missing game state')

  // Useful game data
  const { gameId, nearbyEntities } = gameState

  // Log input
  log(gameId, '📝 COMMITTER', 'Applying approved changes')
  log(gameId, '📝 COMMITTER', approvedChanges)

  // Apply approved changes to the game state
  for (const change of approvedChanges) {
    // fetch the entity from the game state
    const entity = gameState.nearbyEntities.find(entity => entity.entityId === change.entityId)

    // log if not found
    if (!entity) {
      log(gameId, '📝 COMMITTER', `Entity ${change.entityId} not found in game state, skipping change`)
      continue
    }

    // update the statuses
    entity.addStatus(...change.statusesAdded)
    entity.removeStatus(...change.statusesRemoved)

    // save it
    await entity.save()
  }

  // Generate final narrative based on the changes
  const llm = await fetchLLMClient()
  const structuredLLM = llm.withStructuredOutput(FinalNarrativeSchema)
  const prompt = buildCommitterPrompt(userCommand, nearbyEntities, approvedChanges, agentNarratives)
  log(gameId, `📝 COMMITTER - Sending to LLM`, prompt)

  // Invoke LLM for final narrative
  const narrativeResponse = (await structuredLLM.invoke(prompt)) as FinalNarrative
  log(gameId, '📝 COMMITTER - LLM response', narrativeResponse)

  return { finalNarrative: narrativeResponse.finalNarrative }
}

function buildCommitterPrompt(
  userCommand: string,
  nearbyEntities: any[],
  approvedChanges: ApprovedChange[],
  agentNarratives: EntityNarrative[]
) {
  return dedent`
    You are the COMMITTER in a multi-agent text adventure game system.

    TASK: Generate a final narrative response that weaves together the approved state changes into a cohesive, engaging story.

    Your role as Committer:
    - The state changes have already been applied to the game world
    - Create a narrative that describes what happened as a result of the player's action
    - Reference the player's specific command to make the response feel connected
    - Use the nearby entities for environmental context and atmosphere
    - Integrate agent narrative contributions where relevant
    - Focus on the immediate consequences and sensory details
    - Write in present tense, second person ("You...")

    Guidelines:
    - Keep the response concise but atmospheric (2-4 sentences)
    - Start by acknowledging the player's action
    - Emphasize the results of the changes that were made
    - Include sensory details (what the player sees, hears, feels)
    - Reference nearby environment for immersion
    - Maintain consistency with the approved changes
    - If no changes were approved, focus on the attempted action's outcome

    PLAYER COMMAND:
    ${userCommand}

    NEARBY ENTITIES (for environmental context):
    ${JSON.stringify(nearbyEntities)}

    APPROVED CHANGES (already applied):
    ${JSON.stringify(approvedChanges)}

    AGENT NARRATIVES (for context):
    ${JSON.stringify(agentNarratives)}
  `
}
