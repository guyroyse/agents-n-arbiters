import { createNewGame } from '@services/api'

export default class NewGameViewModel {
  #isCreatingGame = $state(false)
  #error = $state<string | null>(null)
  #gameName = $state('')

  constructor() {
    this.generateDefaultName()
  }

  get isCreatingGame() {
    return this.#isCreatingGame
  }

  get error() {
    return this.#error
  }

  get gameName() {
    return this.#gameName
  }

  set gameName(name: string) {
    this.#gameName = name
  }

  async startGame(): Promise<string | null> {
    this.#isCreatingGame = true
    this.#error = null

    try {
      return await createNewGame(this.#gameName.trim())
    } catch (error) {
      this.#error = error instanceof Error ? error.message : 'Failed to create new game'
      return null
    } finally {
      this.#isCreatingGame = false
    }
  }

  clearError() {
    this.#error = null
  }

  private generateDefaultName() {
    const adjectives = ['Epic', 'Mysterious', 'Ancient', 'Forbidden', 'Lost', 'Dark', 'Golden', 'Secret']
    const nouns = ['Quest', 'Adventure', 'Journey', 'Expedition', 'Mission', 'Tale', 'Saga', 'Chronicle']
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    
    this.#gameName = `${adjective} ${noun}`
  }
}