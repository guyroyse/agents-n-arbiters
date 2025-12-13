import type { RediSearchSchema } from 'redis'
import { fetchRedisClient } from '@clients/index.js'
import { dateToTimestamp, timestampToDate } from '@utils/date-utils.js'

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

type GameIndexOptions = {
  ON: 'JSON' | 'HASH' | undefined
  PREFIX: string
}

const GAME_KEY_PREFIX = 'saved:game'
const INDEX_NAME = `${GAME_KEY_PREFIX}:index`

const redisClient = await fetchRedisClient()

async function ensureIndex(): Promise<void> {
  try {
    await redisClient.ft.info(INDEX_NAME)
  } catch (error) {
    // Index doesn't exist, create it
    const schema: RediSearchSchema = {
      '$.gameId': { type: 'TAG', AS: 'gameId' },
      '$.gameName': { type: 'TEXT', SORTABLE: true, AS: 'gameName' },
      '$.lastPlayed': { type: 'NUMERIC', SORTABLE: true, AS: 'lastPlayed' }
    }

    const options: GameIndexOptions = {
      ON: 'JSON',
      PREFIX: `${GAME_KEY_PREFIX}:`
    }

    await redisClient.ft.create(INDEX_NAME, schema, options)
  }
}

export class SavedGame {
  #gameId: string
  #gameName: string
  #lastPlayed: string

  private constructor(gameId: string, gameName: string, lastPlayed: string) {
    this.#gameId = gameId
    this.#gameName = gameName
    this.#lastPlayed = lastPlayed
  }

  /**
   * Create a new SavedGame instance
   */
  static async create(gameId: string, gameName: string, lastPlayed: string): Promise<SavedGame> {
    return new SavedGame(gameId, gameName, lastPlayed)
  }

  get gameId(): string {
    return this.#gameId
  }

  get gameName(): string {
    return this.#gameName
  }

  set gameName(value: string) {
    this.#gameName = value
  }

  get lastPlayed(): string {
    return this.#lastPlayed
  }

  set lastPlayed(value: string) {
    this.#lastPlayed = value
  }

  /**
   * Fetch a specific saved game by ID
   */
  static async fetch(gameId: string): Promise<SavedGame | null> {
    const key = `${GAME_KEY_PREFIX}:${gameId}`

    const redisGame = (await redisClient.json.get(key)) as RedisGameJson | null
    if (!redisGame) return null

    return new SavedGame(redisGame.gameId, redisGame.gameName, timestampToDate(redisGame.lastPlayed))
  }

  /**
   * Fetch all saved games
   */
  static async fetchAll(): Promise<SavedGame[]> {
    await ensureIndex()

    const result = (await redisClient.ft.search(INDEX_NAME, '*', {
      SORTBY: { BY: 'lastPlayed', DIRECTION: 'DESC' },
      LIMIT: { from: 0, size: 100 }
    })) as SearchResult

    if (!result || !result.documents || !Array.isArray(result.documents)) return []

    return result.documents.map(
      doc => new SavedGame(doc.value.gameId, doc.value.gameName, timestampToDate(doc.value.lastPlayed))
    )
  }

  /**
   * Save this game to Redis
   */
  async save(): Promise<void> {
    const key = `${GAME_KEY_PREFIX}:${this.gameId}`

    const redisGame: RedisGameJson = {
      gameId: this.gameId,
      gameName: this.#gameName,
      lastPlayed: dateToTimestamp(this.#lastPlayed)
    }

    await redisClient.json.set(key, '$', redisGame)
  }

  /**
   * Update the lastPlayed timestamp for a game
   */
  static async updateLastPlayed(gameId: string, lastPlayed: string): Promise<void> {
    const key = `${GAME_KEY_PREFIX}:${gameId}`
    await redisClient.json.set(key, '$.lastPlayed', dateToTimestamp(lastPlayed))
  }

  /**
   * Delete a saved game and all its associated entities
   */
  static async delete(gameId: string): Promise<void> {
    const key = `${GAME_KEY_PREFIX}:${gameId}`
    const entityPattern = `game:${gameId}*`

    // Delete game entity keys using SCAN iterator
    for await (const keys of redisClient.scanIterator({ MATCH: entityPattern })) {
      if (keys.length > 0) await redisClient.del(keys)
    }

    // Delete the saved game document
    await redisClient.json.del(key)
  }

  toJSON() {
    return {
      gameId: this.gameId,
      gameName: this.#gameName,
      lastPlayed: this.#lastPlayed
    }
  }
}
