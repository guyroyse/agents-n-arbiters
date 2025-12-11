import { fetchRedisClient } from '@clients/index.js'

type StreamEntry = {
  id: string
  message: {
    [key: string]: string
  }
}

const GAME_KEY_PREFIX = 'saved:game'

const redisClient = await fetchRedisClient()

export class GameTurn {
  #gameId: string
  #command: string
  #reply: string

  private constructor(gameId: string, command: string, reply: string) {
    this.#gameId = gameId
    this.#command = command
    this.#reply = reply
  }

  get gameId(): string {
    return this.#gameId
  }

  get command(): string {
    return this.#command
  }

  get reply(): string {
    return this.#reply
  }

  /**
   * Fetch all turns for a specific game
   */
  static async fetchAll(gameId: string): Promise<GameTurn[]> {
    const key = `${GAME_KEY_PREFIX}:${gameId}:turns`

    const result = (await redisClient.xRange(key, '-', '+')) as StreamEntry[]

    return result.map(entry => new GameTurn(gameId, entry.message.command, entry.message.reply))
  }

  /**
   * Append a new turn to the game's turn stream
   */
  static async append(gameId: string, command: string, reply: string): Promise<GameTurn> {
    const key = `${GAME_KEY_PREFIX}:${gameId}:turns`

    await redisClient.xAdd(key, '*', {
      command,
      reply
    })

    return new GameTurn(gameId, command, reply)
  }
}
