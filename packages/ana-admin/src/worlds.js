import { loadTemplate } from './api.js'

class WorldsView {
  #templateForm
  #templateTextarea
  #loadButton
  #loadSampleButton
  #clearButton
  #statusSection
  #statusContent
  #validationSection
  #validationContent

  constructor() {
    this.#templateForm = document.getElementById('template-form')
    this.#templateTextarea = document.getElementById('template-data')
    this.#loadButton = document.getElementById('load-button')
    this.#loadSampleButton = document.getElementById('load-sample-button')
    this.#clearButton = document.getElementById('clear-button')
    this.#statusSection = document.getElementById('status-section')
    this.#statusContent = document.getElementById('status-content')
    this.#validationSection = document.getElementById('validation-section')
    this.#validationContent = document.getElementById('validation-content')

    this.#bindEvents()
  }

  #bindEvents() {
    this.#templateForm.addEventListener('submit', this.#handleSubmit.bind(this))
    this.#loadSampleButton.addEventListener('click', this.#loadSampleTemplate.bind(this))
    this.#clearButton.addEventListener('click', this.#clearTemplate.bind(this))
  }

  async #handleSubmit(event) {
    event.preventDefault()
    
    const templateJson = this.#templateTextarea.value.trim()
    if (!templateJson) {
      this.#showValidationError('Please enter template data')
      return
    }

    let templateData
    try {
      templateData = JSON.parse(templateJson)
    } catch (error) {
      this.#showValidationError(`Invalid JSON: ${error.message}`)
      return
    }

    // Show confirmation dialog
    const confirmed = await this.#showConfirmationDialog(
      'Load World Template',
      'This will PERMANENTLY DELETE ALL DATA in Redis including all saved games, game history, and existing templates. This action cannot be undone. Are you sure you want to continue?'
    )
    
    if (!confirmed) {
      return
    }

    this.#hideValidationError()
    this.#setLoading(true)

    try {
      const response = await loadTemplate(templateData)
      this.#showStatus(
        `Template loaded successfully! Loaded ${response.entitiesLoaded.player} player and ${response.entitiesLoaded.entities} entities.`, 
        'success'
      )
    } catch (error) {
      this.#showStatus(`Failed to load template: ${error.message}`, 'error')
    } finally {
      this.#setLoading(false)
    }
  }

  #loadSampleTemplate() {
    const sampleTemplate = {
      player: {
        entityId: 'player',
        entityType: 'player',
        name: 'Adventurer',
        description: 'A brave soul seeking ancient secrets',
        locationId: 'shrine-entrance',
        inventory: []
      },
      entities: [
        {
          entityId: 'shrine-entrance',
          entityType: 'location',
          name: 'Shrine Entrance',
          description: 'You stand before an ancient stone shrine, its weathered surface covered in mysterious runes that seem to shimmer in the dim light.',
          fixtureIds: ['stone-altar', 'runic-pillars']
        },
        {
          entityId: 'stone-altar',
          entityType: 'fixture',
          name: 'Stone Altar',
          description: 'An ancient altar carved from dark stone, its surface worn smooth by countless years. Strange symbols are etched around its edges.',
          statuses: ['ancient', 'mysterious'],
          actions: ['examine', 'touch', 'activate']
        },
        {
          entityId: 'runic-pillars',
          entityType: 'fixture',
          name: 'Runic Pillars',
          description: 'Tall stone pillars flanking the shrine entrance, covered in glowing runes that pulse with an otherworldly energy.',
          statuses: ['glowing', 'mystical'],
          actions: ['examine', 'read', 'touch']
        }
      ]
    }

    this.#templateTextarea.value = JSON.stringify(sampleTemplate, null, 2)
    this.#hideValidationError()
    this.#hideStatus()
  }

  #clearTemplate() {
    this.#templateTextarea.value = ''
    this.#hideValidationError()
    this.#hideStatus()
  }

  #setLoading(isLoading) {
    this.#loadButton.disabled = isLoading
    this.#loadButton.textContent = isLoading ? 'Loading...' : 'Load Template'
  }

  #showStatus(message, type = 'info') {
    this.#statusContent.innerHTML = `
      <div class="flex items-center gap-2">
        ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        <span>${message}</span>
      </div>
    `
    this.#statusSection.classList.remove('hidden')
    
    if (type === 'success') {
      setTimeout(() => this.#hideStatus(), 3000)
    }
  }

  #hideStatus() {
    this.#statusSection.classList.add('hidden')
  }

  #showValidationError(message) {
    this.#validationContent.textContent = message
    this.#validationSection.classList.remove('hidden')
  }

  #hideValidationError() {
    this.#validationSection.classList.add('hidden')
  }

  async #showConfirmationDialog(title, message) {
    return new Promise((resolve) => {
      // Create modal overlay
      const overlay = document.createElement('div')
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      
      // Create modal dialog
      const dialog = document.createElement('div')
      dialog.className = 'bg-redis-dusk border border-redis-hyper/20 rounded-lg p-6 max-w-md mx-4'
      
      dialog.innerHTML = `
        <h3 class="text-xl font-bold text-redis-hyper mb-4">${title}</h3>
        <p class="text-redis-white mb-6">${message}</p>
        <div class="flex gap-4 justify-end">
          <button id="cancel-btn" class="bg-redis-dusk-70 text-redis-white px-4 py-2 rounded font-bold hover:bg-redis-dusk-50 transition-colors">
            Cancel
          </button>
          <button id="confirm-btn" class="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition-colors">
            Yes, Delete All Data
          </button>
        </div>
      `
      
      overlay.appendChild(dialog)
      document.body.appendChild(overlay)
      
      // Handle button clicks
      const cancelBtn = dialog.querySelector('#cancel-btn')
      const confirmBtn = dialog.querySelector('#confirm-btn')
      
      const cleanup = () => {
        document.body.removeChild(overlay)
      }
      
      cancelBtn.addEventListener('click', () => {
        cleanup()
        resolve(false)
      })
      
      confirmBtn.addEventListener('click', () => {
        cleanup()
        resolve(true)
      })
      
      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup()
          resolve(false)
        }
      })
      
      // Focus the cancel button by default
      cancelBtn.focus()
    })
  }
}

new WorldsView()