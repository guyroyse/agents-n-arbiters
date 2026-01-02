import type { GameLogData } from '@api-types/response'
import { fetchGameLogs } from '@services/api'

export default class GameLogViewModel {
  #logs = $state<GameLogData[]>([])
  #isLoading = $state(false)
  #error = $state<string | null>(null)
  #gameId: string

  constructor(gameId: string) {
    this.#gameId = gameId
  }

  get logs() {
    return this.#logs
  }

  get isLoading() {
    return this.#isLoading
  }

  get error() {
    return this.#error
  }

  get hasLogs() {
    return this.#logs.length > 0
  }

  async loadLogs() {
    this.#isLoading = true
    this.#error = null

    try {
      this.#logs = await fetchGameLogs(this.#gameId, 1000)
    } catch (error) {
      this.#error = error instanceof Error ? error.message : 'Failed to load logs'
      this.#logs = []
    } finally {
      this.#isLoading = false
    }
  }
}
