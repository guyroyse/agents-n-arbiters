import { fetchRedisClient, removeWorkingMemory, type RedisClient } from '@clients/index.js'
import { dateToTimestamp } from '@utils/date-utils.js'
import { SavedGame } from '@domain/saved-game.js'
import { GameTurn } from '@domain/game-turn.js'
import { GameLog } from '@domain/game-log.js'

const GAME_KEY_PREFIX = 'saved:game'

class GameService {
  #client: RedisClient

  private constructor(client: RedisClient) {
    this.#client = client
  }

  static async create(): Promise<GameService> {
    const client = await fetchRedisClient()
    return new GameService(client)
  }

  async fetchGame(gameId: string): Promise<SavedGame | null> {
    return await SavedGame.fetch(gameId)
  }

  async fetchAllGames(): Promise<SavedGame[]> {
    return await SavedGame.fetchAll()
  }

  async saveGame(gameId: string, gameName: string, lastPlayed: string): Promise<SavedGame> {
    const savedGame = await SavedGame.create(gameId, gameName, lastPlayed)
    await savedGame.save()
    return savedGame
  }

  async updateGame(gameId: string, updates: { gameName?: string; lastPlayed?: string }): Promise<boolean> {
    const savedGame = await SavedGame.fetch(gameId)
    if (!savedGame) return false

    if (updates.gameName) savedGame.gameName = updates.gameName
    if (updates.lastPlayed) savedGame.lastPlayed = updates.lastPlayed
    await savedGame.save()

    return true
  }

  async fetchGameTurns(gameId: string): Promise<GameTurn[]> {
    return await GameTurn.fetchAll(gameId)
  }

  async fetchGameLogs(gameId: string, count: number = 50): Promise<GameLog[]> {
    return await GameLog.fetchAll(gameId, count)
  }

  async saveTurn(gameId: string, command: string, reply: string): Promise<GameTurn> {
    const gameTurn = await GameTurn.append(gameId, command, reply)

    // Update the lastPlayed timestamp on the saved game
    const gameKeyName = this.gameKey(gameId)
    const now = new Date().toISOString()
    await this.#client.json.set(gameKeyName, '$.lastPlayed', dateToTimestamp(now))

    return gameTurn
  }

  async removeGame(gameId: string): Promise<void> {
    const gameKeyName = this.gameKey(gameId)
    const turnsKeyName = this.turnsKey(gameId)
    const logKeyName = this.logKey(gameId)
    const gameEntityPattern = this.gameEntityPattern(gameId)

    // Delete game entity keys using SCAN iterator
    for await (const keys of this.#client.scanIterator({ MATCH: gameEntityPattern })) {
      if (keys.length > 0) this.#client.del(keys)
    }

    // Delete AMS working memory for narrator
    await removeWorkingMemory(gameId, 'narrator')

    // not awaiting uses pipelining for concurrent deletion
    this.#client.del(turnsKeyName)
    this.#client.json.del(gameKeyName)
    await this.#client.del(logKeyName)
  }

  private gameKey(gameId: string): string {
    return `${GAME_KEY_PREFIX}:${gameId}`
  }

  private turnsKey(gameId: string): string {
    return `${this.gameKey(gameId)}:turns`
  }

  private logKey(gameId: string): string {
    return `${this.gameKey(gameId)}:log`
  }

  private gameEntityPattern(gameId: string): string {
    return `game:${gameId}*`
  }
}

export default await GameService.create()
