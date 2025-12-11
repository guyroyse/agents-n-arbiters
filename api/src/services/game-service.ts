import { removeWorkingMemory } from '@clients/index.js'
import { SavedGame } from '@domain/saved-game.js'
import { GameTurn } from '@domain/game-turn.js'
import { GameLog } from '@domain/game-log.js'

class GameService {
  private constructor() {}

  static async create(): Promise<GameService> {
    return new GameService()
  }

  async fetchGame(gameId: string): Promise<SavedGame | null> {
    return await SavedGame.fetch(gameId)
  }

  async fetchAllGames(): Promise<SavedGame[]> {
    return await SavedGame.fetchAll()
  }

  async fetchGameTurns(gameId: string): Promise<GameTurn[]> {
    return await GameTurn.fetchAll(gameId)
  }

  async fetchGameLogs(gameId: string, count: number = 50): Promise<GameLog[]> {
    return await GameLog.fetchAll(gameId, count)
  }

  async saveGame(gameId: string, gameName: string, lastPlayed: string): Promise<SavedGame> {
    const savedGame = await SavedGame.create(gameId, gameName, lastPlayed)
    await savedGame.save()
    return savedGame
  }

  async saveTurn(gameId: string, command: string, reply: string): Promise<GameTurn> {
    const gameTurn = await GameTurn.append(gameId, command, reply)

    // Update the lastPlayed timestamp on the saved game
    const now = new Date().toISOString()
    await SavedGame.updateLastPlayed(gameId, now)

    return gameTurn
  }

  async removeGame(gameId: string): Promise<void> {
    await SavedGame.delete(gameId)
    await GameTurn.deleteAll(gameId)
    await GameLog.deleteAll(gameId)
    await removeWorkingMemory(gameId, 'narrator')
  }
}
export default await GameService.create()
