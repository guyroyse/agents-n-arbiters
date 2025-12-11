import { fetchRedisClient } from '@clients/index.js'

type StreamEntry = {
  id: string
  message: {
    [key: string]: string
  }
}

const GAME_KEY_PREFIX = 'saved:game'

const redisClient = await fetchRedisClient()

export class GameLog {
  #id: string
  #timestamp: number
  #gameId: string
  #contentType: string
  #prefix: string
  #content: string
  #messageType?: string
  #messageName?: string
  #messageIndex?: number

  private constructor(
    id: string,
    timestamp: number,
    gameId: string,
    contentType: string,
    prefix: string,
    content: string,
    messageType?: string,
    messageName?: string,
    messageIndex?: number
  ) {
    this.#id = id
    this.#timestamp = timestamp
    this.#gameId = gameId
    this.#contentType = contentType
    this.#prefix = prefix
    this.#content = content
    this.#messageType = messageType
    this.#messageName = messageName
    this.#messageIndex = messageIndex
  }

  get id(): string {
    return this.#id
  }

  get timestamp(): number {
    return this.#timestamp
  }

  get gameId(): string {
    return this.#gameId
  }

  get contentType(): string {
    return this.#contentType
  }

  get prefix(): string {
    return this.#prefix
  }

  get content(): string {
    return this.#content
  }

  get messageType(): string | undefined {
    return this.#messageType
  }

  get messageName(): string | undefined {
    return this.#messageName
  }

  get messageIndex(): number | undefined {
    return this.#messageIndex
  }

  /**
   * Fetch all log entries for a specific game
   */
  static async fetchAll(gameId: string, count: number = 50): Promise<GameLog[]> {
    // Validate count
    if (count < 1 || count > 1000) {
      throw new Error('Count must be between 1 and 1000')
    }

    const key = `${GAME_KEY_PREFIX}:${gameId}:log`

    const result = (await redisClient.xRange(key, '-', '+', { COUNT: count })) as StreamEntry[]

    return result.map(entry => {
      const messageIndex = entry.message.messageIndex ? parseInt(entry.message.messageIndex) : undefined
      const messageName = entry.message.messageName === 'none' ? undefined : entry.message.messageName

      return new GameLog(
        entry.id,
        parseInt(entry.id.split('-')[0]),
        entry.message.gameId || gameId,
        entry.message.contentType || 'unknown',
        entry.message.prefix || '',
        entry.message.content || '',
        entry.message.messageType || undefined,
        messageName,
        messageIndex
      )
    })
  }

  /**
   * Append a new log entry to the game's log stream
   */
  static async append(
    gameId: string,
    contentType: string,
    prefix: string,
    content: string,
    messageType?: string,
    messageName?: string,
    messageIndex?: number
  ): Promise<GameLog> {
    const key = `${GAME_KEY_PREFIX}:${gameId}:log`

    const streamData: Record<string, string> = {
      gameId,
      contentType,
      prefix,
      content
    }

    if (messageType !== undefined) streamData.messageType = messageType
    if (messageName !== undefined) streamData.messageName = messageName
    if (messageIndex !== undefined) streamData.messageIndex = messageIndex.toString()

    const id = (await redisClient.xAdd(key, '*', streamData)) as string

    return new GameLog(
      id,
      parseInt(id.split('-')[0]),
      gameId,
      contentType,
      prefix,
      content,
      messageType,
      messageName,
      messageIndex
    )
  }
}
