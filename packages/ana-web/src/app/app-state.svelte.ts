export default class AppState {
  static #instance: AppState
  #currentGameId = $state<string | null>(null)

  private constructor() {}

  static get instance() {
    return this.#instance ?? (this.#instance = new AppState())
  }

  get currentGameId(): string | null {
    return this.#currentGameId
  }

  set currentGameId(gameId: string) {
    this.#currentGameId = gameId
  }

  clearCurrentGameId() {
    this.#currentGameId = null
  }
}
