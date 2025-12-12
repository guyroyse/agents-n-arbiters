import { loadTemplate } from '@services/api'
import type { LoadTemplateRequest, LoadTemplateResponse } from '@ana/types'

export default class LoadTemplateViewModel {
  #templateJson = $state('')
  #isLoading = $state(false)
  #error = $state<string | null>(null)
  #validationError = $state<string | null>(null)
  #successMessage = $state<string | null>(null)

  get templateJson() {
    return this.#templateJson
  }

  set templateJson(value: string) {
    this.#templateJson = value
    this.#validationError = null
  }

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

  async loadTemplateData(): Promise<boolean> {
    const trimmed = this.#templateJson.trim()
    
    if (!trimmed) {
      this.#validationError = 'Please enter template data'
      return false
    }

    let templateData: LoadTemplateRequest
    try {
      templateData = JSON.parse(trimmed)
    } catch (error) {
      this.#validationError = `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      return false
    }

    // Validate structure
    if (!templateData.player || !templateData.entities) {
      this.#validationError = 'Template must include "player" and "entities" fields'
      return false
    }

    this.#isLoading = true
    this.#error = null
    this.#validationError = null
    this.#successMessage = null

    try {
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

  loadSampleTemplate() {
    this.#templateJson = JSON.stringify(SAMPLE_TEMPLATE, null, 2)
    this.#validationError = null
    this.#error = null
    this.#successMessage = null
  }

  clearTemplate() {
    this.#templateJson = ''
    this.#validationError = null
    this.#error = null
    this.#successMessage = null
  }

  clearError() {
    this.#error = null
  }

  clearSuccess() {
    this.#successMessage = null
  }
}

const SAMPLE_TEMPLATE = {
  player: {
    entityId: 'player',
    entityType: 'player',
    name: 'Adventurer',
    description: 'A brave soul seeking ancient secrets',
    locationId: 'shrine-entrance',
    entityPrompt: 'You are a curious adventurer with experience in exploring ancient ruins and deciphering mysteries.'
  },
  entities: [
    {
      entityId: 'shrine-entrance',
      entityType: 'location',
      name: 'Shrine Entrance',
      description: 'An ancient stone archway marks the entrance to a forgotten shrine.',
      fixtureIds: ['stone-altar'],
      exitIds: ['path-north'],
      statuses: ['ancient']
    },
    {
      entityId: 'stone-altar',
      entityType: 'fixture',
      name: 'Stone Altar',
      description: 'A weathered altar covered in mysterious runes.',
      actions: ['examine', 'touch'],
      statuses: ['mysterious']
    },
    {
      entityId: 'path-north',
      entityType: 'exit',
      name: 'Northern Path',
      description: 'A narrow path leading deeper into the shrine.',
      destinationId: 'inner-chamber',
      statuses: []
    },
    {
      entityId: 'inner-chamber',
      entityType: 'location',
      name: 'Inner Chamber',
      description: 'A dimly lit chamber with ancient murals on the walls.',
      fixtureIds: [],
      exitIds: ['path-south'],
      statuses: ['dark']
    },
    {
      entityId: 'path-south',
      entityType: 'exit',
      name: 'Southern Path',
      description: 'The path back to the entrance.',
      destinationId: 'shrine-entrance',
      statuses: []
    }
  ]
}

