import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type {
  SavedGame,
  GameTurn,
  CreateGameRequest,
  UpdateGameNameRequest,
  TakeGameTurnRequest,
  TakeGameTurnResponse
} from '@ana/shared'
import { ulid } from 'ulid'
import responses from '../lib/http-responses.js'

// Mock saved games data (will be replaced with Redis persistence)
const mockGames: SavedGame[] = [
  {
    gameId: 'demo-game-001',
    gameName: 'Ancient Quest',
    lastPlayed: '2025-01-14T15:30:00Z'
  },
  {
    gameId: 'demo-game-002',
    gameName: 'Mysterious Adventure',
    lastPlayed: '2025-01-12T09:15:00Z'
  },
  {
    gameId: 'demo-game-003',
    gameName: 'Epic Journey',
    lastPlayed: '2025-01-10T14:45:00Z'
  }
]

// Mock game turns data (will be replaced with Redis persistence)
const mockGameTurns: Record<string, GameTurn[]> = {
  'demo-game-001': [
    {
      command: 'look around',
      reply: 'You are in a dimly lit room. There is a door to the north and a chest in the corner.'
    },
    {
      command: 'examine chest',
      reply: 'The chest is old and weathered. It appears to be unlocked.'
    }
  ],
  'demo-game-002': [
    {
      command: 'look',
      reply: 'You stand at the edge of a mysterious forest. Ancient trees tower above you.'
    }
  ],
  'demo-game-003': []
}

export async function fetchGames(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a get saved games request.')

  try {
    return responses.ok(mockGames)
  } catch (error) {
    context.error('Error fetching games:', error)
    return responses.serverError('Failed to fetch games')
  }
}

export async function createGame(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a create saved game request.')

  try {
    const body = await request.json()
    const { gameName } = body as CreateGameRequest

    if (!gameName || typeof gameName !== 'string' || gameName.trim().length === 0) {
      return responses.badRequest('Game name is required and must be a non-empty string')
    }

    const gameId = ulid()
    const newGame: SavedGame = {
      gameId,
      gameName: gameName.trim(),
      lastPlayed: new Date().toISOString()
    }

    mockGames.unshift(newGame)

    context.log(`Created new game: "${gameName}" with ID: ${gameId}`)

    return responses.created(newGame)
  } catch (error) {
    context.error('Error creating game:', error)
    return responses.badRequest('Invalid request format')
  }
}

export async function fetchGame(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a fetch game request.')

  try {
    const gameId = request.params.gameId

    if (!gameId) return responses.badRequest('Game ID is required')

    const game = mockGames.find(game => game.gameId === gameId)

    if (!game) return responses.notFound('Game not found')

    return responses.ok(game)
  } catch (error) {
    context.error('Error fetching game:', error)
    return responses.serverError('Failed to fetch game')
  }
}

export async function fetchGameTurns(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a fetch game turns request.')

  try {
    const gameId = request.params.gameId

    if (!gameId) {
      return responses.badRequest('Game ID is required')
    }

    const turns = mockGameTurns[gameId] ?? []

    return responses.ok(turns)
  } catch (error) {
    context.error('Error fetching game turns:', error)
    return responses.serverError('Failed to fetch game turns')
  }
}

export async function takeGameTurn(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a take game turn request.')

  try {
    const gameId = request.params.gameId
    const body = await request.json()
    const { command } = body as TakeGameTurnRequest

    if (!gameId) return responses.badRequest('Game ID is required')

    context.log(`Processing turn for game ${gameId}: ${command}`)

    // For now, just echo back the command
    const response: TakeGameTurnResponse = {
      command,
      reply: `You typed: ${command}`
    }

    return responses.ok(response)
  } catch (error) {
    context.error('Error processing take game turn request:', error)
    return responses.badRequest('Invalid request format')
  }
}

export async function updateGameName(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed an update game name request.')

  try {
    const gameId = request.params.gameId

    if (!gameId) return responses.badRequest('Game ID is required')

    const body = (await request.json()) as UpdateGameNameRequest
    const { gameName } = body

    if (!gameName || typeof gameName !== 'string' || gameName.trim().length === 0)
      return responses.badRequest('Game name is required and must be a non-empty string')

    const gameIndex = mockGames.findIndex(game => game.gameId === gameId)

    if (gameIndex === -1) return responses.notFound('Game not found')

    const updatedGame: SavedGame = {
      ...mockGames[gameIndex],
      gameName: gameName.trim(),
      lastPlayed: new Date().toISOString()
    }

    mockGames[gameIndex] = updatedGame
    context.log(`Updated game: "${gameName}" with ID: ${gameId}`)

    return responses.ok(updatedGame)
  } catch (error) {
    context.error('Error updating game name:', error)
    return responses.badRequest('Invalid request format')
  }
}

export async function deleteGame(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a delete game request.')

  try {
    const gameId = request.params.gameId

    if (!gameId) return responses.badRequest('Game ID is required')

    // Find and remove the game (will be replaced with Redis deletion)
    const gameIndex = mockGames.findIndex(game => game.gameId === gameId)

    if (gameIndex === -1) return responses.notFound('Game not found')

    const deletedGame = mockGames.splice(gameIndex, 1)[0]
    context.log(`Deleted game: "${deletedGame.gameName}" with ID: ${gameId}`)

    return responses.noContent()
  } catch (error) {
    context.error('Error deleting game:', error)
    return responses.serverError('Failed to delete game')
  }
}
