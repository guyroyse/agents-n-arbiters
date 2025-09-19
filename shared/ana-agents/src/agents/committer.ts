import { log } from '@ana/common/utils'
import {
  GameTurnAnnotation,
  type EntityChange,
  type EntityPropertyChange,
  type EntityStatusAddition,
  type EntityStatusRemoval
} from '@/game-turn-state.js'
import { LocationEntity, type GameEntity, type GameState, type PlayerEntity } from '@ana/domain'

type CommitterReturnType = Partial<typeof GameTurnAnnotation.State>

export async function committer(state: typeof GameTurnAnnotation.State): Promise<CommitterReturnType> {
  const gameState = state.gameState
  const entityChanges = state.entityChanges as EntityChange[]

  // Basic validation
  if (!gameState) throw new Error('Missing game state')

  // Apply entity changes to the game state
  await applyEntityChanges(gameState, entityChanges)

  // Committer does not produce new state, just applies changes
  return {}
}

async function applyEntityChanges(gameState: GameState, changes: EntityChange[]): Promise<void> {
  const { gameId } = gameState

  log(gameId, '📝 COMMITTER - Entity changes', changes)
  for (const change of changes) {
    await applyEntityChange(gameState, change)
  }
}

async function applyEntityChange(gameState: GameState, change: EntityChange): Promise<void> {
  const entity = gameState.nearbyEntities.find((entity: GameEntity) => entity.entityId === change.entityId)

  if (!entity) {
    log(gameState.gameId, '📝 COMMITTER', `Entity ${change.entityId} not found in game state, skipping change`)
    return
  }

  // Apply changes
  applyStatusAdditions(entity, change.addStatuses)
  applyStatusRemovals(entity, change.removeStatuses)
  await applyPropertyChanges(gameState, entity, change.entityId, change.setProperties)

  // Save the entity with all changes applied
  await entity.save()
}

function applyStatusAdditions(entity: GameEntity, additions: EntityStatusAddition[]): void {
  for (const statusToAdd of additions) entity.addStatus(statusToAdd.status)
}

function applyStatusRemovals(entity: GameEntity, removals: EntityStatusRemoval[]): void {
  for (const statusToRemove of removals) entity.removeStatus(statusToRemove.status)
}

async function applyPropertyChanges(
  gameState: GameState,
  entity: GameEntity,
  entityId: string,
  changes: EntityPropertyChange[]
): Promise<void> {
  for (const change of changes) await applyPropertyChange(gameState, entity, entityId, change)
}

async function applyPropertyChange(
  gameState: GameState,
  entity: GameEntity,
  entityId: string,
  change: EntityPropertyChange
): Promise<void> {
  if (change.property === 'locationId' && entity.entityType === 'player') {
    await updatePlayerLocation(gameState, entity as PlayerEntity, change)
  } else {
    log(
      gameState.gameId,
      '📝 COMMITTER',
      `Unknown property "${change.property}" for ${entityId}, skipping change: ${change.reasoning}`
    )
  }
}

async function updatePlayerLocation(
  gameState: GameState,
  player: PlayerEntity,
  change: EntityPropertyChange
): Promise<void> {
  // Make sure location exists in game state
  const location = await LocationEntity.fetch(gameState.gameId, change.value)
  if (!location) {
    log(gameState.gameId, '📝 COMMITTER', `Invalid location "${change.value}" for player, skipping change`)
    return
  }

  // Update player location
  log(gameState.gameId, '📝 COMMITTER', `Updating player location to "${change.value}"`)
  player.locationId = change.value
}
