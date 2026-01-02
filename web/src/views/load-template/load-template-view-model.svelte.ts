import { loadTemplate } from '@services/api'
import type { LoadTemplateRequest } from '@api-types/request'

export default class LoadTemplateViewModel {
  #isLoading = $state(false)
  #error = $state<string | null>(null)
  #validationError = $state<string | null>(null)
  #successMessage = $state<string | null>(null)

  get isLoading() {
    return this.#isLoading
  }

  get error() {
    return this.#error
  }

  get validationError() {
    return this.#validationError
  }

  get successMessage() {
    return this.#successMessage
  }

  async loadTemplateFromFile(file: File): Promise<boolean> {
    this.#isLoading = true
    this.#error = null
    this.#validationError = null
    this.#successMessage = null

    try {
      // Read the file
      const text = await file.text()

      // Parse JSON
      let templateData: LoadTemplateRequest
      try {
        templateData = JSON.parse(text)
      } catch (error) {
        this.#validationError = `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
        return false
      }

      // Validate structure
      if (!templateData.player || !templateData.entities) {
        this.#validationError = 'Template must include "player" and "entities" fields'
        return false
      }

      // Load the template
      const response = await loadTemplate(templateData)
      this.#successMessage = `Template loaded successfully! Loaded ${response.entitiesLoaded.player} player and ${response.entitiesLoaded.entities} entities.`
      return true
    } catch (error) {
      this.#error = error instanceof Error ? error.message : 'Failed to load template'
      return false
    } finally {
      this.#isLoading = false
    }
  }

  clearError() {
    this.#error = null
  }

  clearSuccess() {
    this.#successMessage = null
  }
}
