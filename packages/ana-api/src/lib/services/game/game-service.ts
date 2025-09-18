import type { RediSearchSchema } from 'redis'

import type { SavedGame, GameTurn, GameLogEntry } from '@ana/types'

import { fetchRedisClient, type RedisClient } from '@ana/common/clients'
import { dateToTimestamp, timestampToDate } from '@ana/common/utils'

type GameIndexOptions = {
  ON: 'JSON' | 'HASH' | undefined
  PREFIX: string
}

type RedisGameJson = {
  gameId: string
  gameName: string
  lastPlayed: number
}

type SearchResult = {
  documents: Array<{
    value: RedisGameJson
  }>
}

type StreamEntry = {
  id: string
  message: {
    [key: string]: string
  }
}

const GAME_KEY_PREFIX = 'saved:game'
const INDEX_NAME = `${GAME_KEY_PREFIX}:index`

class GameService {
  #client: RedisClient

  private constructor(client: RedisClient) {
    this.#client = client
  }

  static async create(): Promise<GameService> {
    const client = await fetchRedisClient()
    return new GameService(client)
  }

  async saveGame(game: SavedGame): Promise<void> {
    const key = this.gameKey(game.gameId)

    const redisGame: RedisGameJson = {
      gameId: game.gameId,
      gameName: game.gameName,
      lastPlayed: dateToTimestamp(game.lastPlayed)
    }

    await this.#client.json.set(key, '$', redisGame)
  }

  async fetchAllGames(): Promise<SavedGame[]> {
    await this.ensureGameIndex()

    const result = (await this.#client.ft.search(INDEX_NAME, '*', {
      SORTBY: { BY: 'lastPlayed', DIRECTION: 'DESC' },
      LIMIT: { from: 0, size: 100 }
    })) as SearchResult

    if (!result || !result.documents || !Array.isArray(result.documents)) return []

    return result.documents.map(doc => ({
      gameId: doc.value.gameId,
      gameName: doc.value.gameName,
      lastPlayed: timestampToDate(doc.value.lastPlayed)
    }))
  }

  async fetchGame(gameId: string): Promise<SavedGame | null> {
    const key = this.gameKey(gameId)

    const redisGame = (await this.#client.json.get(key)) as RedisGameJson | null
    if (!redisGame) return null

    return {
      gameId: redisGame.gameId,
      gameName: redisGame.gameName,
      lastPlayed: timestampToDate(redisGame.lastPlayed)
    }
  }

  async fetchGameTurns(gameId: string): Promise<GameTurn[]> {
    const turnsKeyName = this.turnsKey(gameId)

    const result = (await this.#client.xRange(turnsKeyName, '-', '+')) as StreamEntry[]

    return result.map(entry => ({
      command: entry.message.command as string,
      reply: entry.message.reply as string
    }))
  }

  async fetchGameLogs(gameId: string, count: number = 50): Promise<GameLogEntry[]> {
    // Validate count
    if (count < 1 || count > 1000) {
      throw new Error('Count must be between 1 and 1000')
    }

    const logStreamKey = this.logKey(gameId)

    // Use XRANGE to get logs in chronological order (oldest first)
    const logs = (await this.#client.xRange(logStreamKey, '-', '+', { COUNT: count })) as StreamEntry[]

    // Transform Redis stream entries to GameLogEntry objects
    return logs.map(entry => ({
      id: entry.id,
      timestamp: parseInt(entry.id.split('-')[0]),
      gameId: entry.message.gameId || gameId,
      contentType: entry.message.contentType || 'unknown',
      prefix: entry.message.prefix || '',
      content: entry.message.content || '',
      messageType: entry.message.messageType || undefined,
      messageName: entry.message.messageName === 'none' ? undefined : entry.message.messageName,
      messageIndex: entry.message.messageIndex ? parseInt(entry.message.messageIndex) : undefined
    }))
  }

  async updateGame(gameId: string, updates: Partial<SavedGame>): Promise<boolean> {
    const key = this.gameKey(gameId)

    const currentGame = await this.fetchGame(gameId)
    if (!currentGame) return false

    if (updates.gameName !== undefined) {
      await this.#client.json.set(key, '$.gameName', updates.gameName)
    }

    if (updates.lastPlayed !== undefined) {
      await this.#client.json.set(key, '$.lastPlayed', dateToTimestamp(updates.lastPlayed))
    }

    return true
  }

  async saveTurn(gameId: string, turn: GameTurn): Promise<void> {
    const turnsKeyName = this.turnsKey(gameId)
    const gameKeyName = this.gameKey(gameId)

    await this.#client.xAdd(turnsKeyName, '*', turn)

    const now = new Date().toISOString()
    await this.#client.json.set(gameKeyName, '$.lastPlayed', dateToTimestamp(now))
  }

  async removeGame(gameId: string): Promise<void> {
    const gameKeyName = this.gameKey(gameId)
    const turnsKeyName = this.turnsKey(gameId)
    const logKeyName = this.logKey(gameId)

    // not awaiting uses pipelining
    this.#client.del(turnsKeyName)
    this.#client.json.del(gameKeyName)
    await this.#client.del(logKeyName)
  }

  private async ensureGameIndex(): Promise<void> {
    try {
      await this.#client.ft.info(INDEX_NAME)
    } catch (error) {
      const schema: RediSearchSchema = {
        '$.gameId': { type: 'TAG', AS: 'gameId' },
        '$.gameName': { type: 'TEXT', SORTABLE: true, AS: 'gameName' },
        '$.lastPlayed': { type: 'NUMERIC', SORTABLE: true, AS: 'lastPlayed' }
      }

      const options: GameIndexOptions = {
        ON: 'JSON',
        PREFIX: `${GAME_KEY_PREFIX}:`
      }

      await this.#client.ft.create(INDEX_NAME, schema, options)
    }
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
}

export default await GameService.create()
