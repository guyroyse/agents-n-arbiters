import type { GameTurnData } from '@api-types/response'
import { takeTurn, fetchGameTurns } from '@services/api'

export default class GameViewModel {
  #history = $state<GameTurnData[]>([])
  #currentCommand = $state('')
  #isLoadingHistory = $state(false)
  #isProcessingCommand = $state(false)
  #gameId: string

  constructor(gameId: string) {
    this.#gameId = gameId
  }

  get isLoadingHistory() {
    return this.#isLoadingHistory
  }

  get isProcessingCommand() {
    return this.#isProcessingCommand
  }

  get isLoading() {
    return this.#isLoadingHistory || this.#isProcessingCommand
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
      this.#isProcessingCommand = true

      try {
        await this.takeTurn(command)
      } catch (error) {
        this.displayError(command, error)
      } finally {
        this.#isProcessingCommand = false
      }
    }
  }

  async loadGameHistory() {
    this.#isLoadingHistory = true
    try {
      this.#history = await fetchGameTurns(this.#gameId)
    } catch (error) {
      console.error('Failed to load game history:', error)
      this.#history = []
    } finally {
      this.#isLoadingHistory = false
    }
  }

  private async takeTurn(command: string) {
    const gameTurn: GameTurnData = await takeTurn(this.#gameId, command)
    this.#history.push(gameTurn)
  }

  private displayError(command: string, error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    this.#history.push({ command, reply: `Error: ${errorMessage}` })
  }

  private canSubmit() {
    return !this.isLoading && this.trimmedCommand().length > 0
  }

  private trimmedCommand() {
    return this.#currentCommand.trim()
  }

  private clearInput() {
    this.#currentCommand = ''
  }
}
