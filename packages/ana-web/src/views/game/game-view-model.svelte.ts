import type { GameHistoryEntry, TakeTurnResponse, TakeTurnRequest } from '@ana/shared'
import { takeTurn, fetchGameHistory } from '@services/api'

export default class GameViewModel {
  #history = $state<GameHistoryEntry[]>([])
  #currentCommand = $state('')
  #isLoading = $state(false)
  #savedGameId: string

  constructor(savedGameId: string) {
    this.#savedGameId = savedGameId
  }

  get isLoading() {
    return this.#isLoading
  }

  get currentCommand() {
    return this.#currentCommand
  }

  set currentCommand(command: string) {
    this.#currentCommand = command
  }

  get history() {
    return this.#history
  }

  get historyCount() {
    return this.#history.length
  }

  async submitCommand() {
    if (this.canSubmit()) {
      const command = this.trimmedCommand()
      this.clearInput()
      this.#isLoading = true

      try {
        await this.takeTurn(command)
      } catch (error) {
        this.displayError(command, error)
      } finally {
        this.#isLoading = false
      }
    }
  }

  async loadGameHistory() {
    this.#isLoading = true
    try {
      this.#history = await fetchGameHistory(this.#savedGameId)
    } catch (error) {
      console.error('Failed to load game history:', error)
      this.#history = []
    } finally {
      this.#isLoading = false
    }
  }

  private async takeTurn(command: string) {
    const request: TakeTurnRequest = { savedGameId: this.#savedGameId, command }
    const response: TakeTurnResponse = await takeTurn(request)
    this.appendHistory(command, response.result)
  }

  private displayError(command: string, error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    this.appendHistory(command, `Error: ${errorMessage}`)
  }

  private canSubmit() {
    return !this.#isLoading && this.trimmedCommand().length > 0
  }

  private trimmedCommand() {
    return this.#currentCommand.trim()
  }

  private clearInput() {
    this.#currentCommand = ''
  }

  private appendHistory(command: string, response: string) {
    this.#history.push({ command, response })
  }
}
