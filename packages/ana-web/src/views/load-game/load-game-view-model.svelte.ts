import type { SavedGame } from '@ana/types'
import { fetchSavedGames, deleteGame } from '@services/api'

export default class LoadGameViewModel {
  #savedGames = $state<SavedGame[]>([])
  #isLoading = $state(true)
  #error = $state<string | null>(null)
  #deletingGameId = $state<string | null>(null)
  #showDeleteConfirmation = $state(false)
  #gameToDelete = $state<SavedGame | null>(null)

  get savedGames() {
    return this.#savedGames
  }

  get isLoading() {
    return this.#isLoading
  }

  get error() {
    return this.#error
  }

  get deletingGameId() {
    return this.#deletingGameId
  }

  get showDeleteConfirmation() {
    return this.#showDeleteConfirmation
  }

  get gameToDelete() {
    return this.#gameToDelete
  }

  get hasSavedGames() {
    return this.#savedGames.length > 0
  }

  async loadSavedGames() {
    this.#isLoading = true
    this.#error = null

    try {
      this.#savedGames = await fetchSavedGames()
    } catch (error) {
      this.#error = error instanceof Error ? error.message : 'Failed to load saved games'
    } finally {
      this.#isLoading = false
    }
  }

  confirmDeleteGame(game: SavedGame) {
    this.#gameToDelete = game
    this.#showDeleteConfirmation = true
  }

  cancelDelete() {
    this.#gameToDelete = null
    this.#showDeleteConfirmation = false
  }

  async deleteGame(gameId: string) {
    this.#deletingGameId = gameId

    try {
      await deleteGame(gameId)
      
      // Remove from local array
      this.#savedGames = this.#savedGames.filter(
        game => game.gameId !== gameId
      )
    } catch (error) {
      this.#error = error instanceof Error ? error.message : 'Failed to delete game'
    } finally {
      this.#deletingGameId = null
    }
  }

  async deleteConfirmedGame() {
    if (!this.#gameToDelete) return

    this.#deletingGameId = this.#gameToDelete.gameId
    this.#showDeleteConfirmation = false

    try {
      await deleteGame(this.#gameToDelete.gameId)
      
      // Remove from local array
      this.#savedGames = this.#savedGames.filter(
        game => game.gameId !== this.#gameToDelete!.gameId
      )
    } catch (error) {
      this.#error = error instanceof Error ? error.message : 'Failed to delete game'
    } finally {
      this.#deletingGameId = null
      this.#gameToDelete = null
    }
  }

  formatLastPlayed(isoString: string): string {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}