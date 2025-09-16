import './style.css'
import { fetchGames, fetchGameLogs } from './api.js'
import '@alenaksu/json-viewer'
import mermaid from 'mermaid'

// Initialize Mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Space Mono, monospace'
})

class LogViewer {
  constructor() {
    this.gameSelect = document.getElementById('game-select')
    this.countInput = document.getElementById('count-input')
    this.loadBtn = document.getElementById('load-btn')
    this.logForm = document.getElementById('log-form')
    this.loadingEl = document.getElementById('loading')
    this.errorEl = document.getElementById('error')
    this.errorMessageEl = document.getElementById('error-message')
    this.emptyEl = document.getElementById('empty')
    this.logEntriesEl = document.getElementById('log-entries')
    this.statsEl = document.getElementById('stats')
    this.statsCountEl = document.getElementById('stats-count')

    this.init()
  }

  async init() {
    await this.loadGames()
    this.bindEvents()
  }

  async loadGames() {
    try {
      const games = await fetchGames()
      this.populateGameSelect(games)
    } catch (error) {
      this.showError(`Failed to load games: ${error.message}`)
    }
  }

  populateGameSelect(games) {
    this.gameSelect.innerHTML = ''

    if (games.length === 0) {
      this.gameSelect.innerHTML = '<option value="">No games found</option>'
      this.loadBtn.disabled = true
      return
    }

    // Add placeholder option
    const placeholder = document.createElement('option')
    placeholder.value = ''
    placeholder.textContent = 'Select a game...'
    this.gameSelect.appendChild(placeholder)

    // Add game options
    games.forEach(game => {
      const option = document.createElement('option')
      option.value = game.gameId
      option.textContent = `${game.gameName} (${new Date(game.lastPlayed).toLocaleDateString()})`
      this.gameSelect.appendChild(option)
    })

    this.loadBtn.disabled = false
  }

  bindEvents() {
    this.logForm.addEventListener('submit', e => {
      e.preventDefault()
      this.loadLogs()
    })

    // Allow Enter key in count input to submit form
    this.countInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault()
        this.loadLogs()
      }
    })
  }

  async loadLogs() {
    const gameId = this.gameSelect.value
    const count = parseInt(this.countInput.value)

    if (!gameId) {
      this.showError('Please select a game')
      return
    }

    if (count < 1 || count > 1000) {
      this.showError('Count must be between 1 and 1000')
      return
    }

    this.showLoading()

    try {
      const logs = await fetchGameLogs(gameId, count)
      this.renderLogs(logs)
    } catch (error) {
      this.showError(`Failed to load logs: ${error.message}`)
    }
  }

  showLoading() {
    this.hideAllStates()
    this.loadingEl.classList.remove('hidden')
    this.loadBtn.disabled = true
  }

  showError(message) {
    this.hideAllStates()
    this.errorMessageEl.textContent = message
    this.errorEl.classList.remove('hidden')
    this.loadBtn.disabled = false
  }

  showEmpty() {
    this.hideAllStates()
    this.emptyEl.classList.remove('hidden')
    this.loadBtn.disabled = false
  }

  hideAllStates() {
    this.loadingEl.classList.add('hidden')
    this.errorEl.classList.add('hidden')
    this.emptyEl.classList.add('hidden')
    this.statsEl.classList.add('hidden')
  }


  renderLogs(logs) {
    this.hideAllStates()
    this.loadBtn.disabled = false

    if (logs.length === 0) {
      this.showEmpty()
      return
    }

    // Clear previous logs
    this.logEntriesEl.innerHTML = ''

    // Render each log entry
    logs.forEach((log, index) => {
      const logElement = this.createLogElement(log, index)
      this.logEntriesEl.appendChild(logElement)
    })

    // Show stats
    this.statsCountEl.textContent = logs.length
    this.statsEl.classList.remove('hidden')
  }


  createLogElement(log, index) {
    const container = document.createElement('div')
    container.className = 'bg-redis-dusk border border-redis-hyper/20 rounded-lg overflow-hidden'

    // Header with timestamp and prefix
    const header = document.createElement('div')
    header.className = 'bg-redis-midnight p-4 border-b border-redis-hyper/20'

    header.innerHTML = `
      <div class="flex flex-wrap gap-2 items-center text-sm">
        <span class="text-redis-hyper font-bold">
          ${new Date(log.timestamp).toLocaleString()}
        </span>
        ${log.prefix ? `<span class="text-redis-white font-mono">${log.prefix}</span>` : ''}
      </div>
    `

    // Content area
    const content = document.createElement('div')
    content.className = 'p-4'

    // Render content based on type
    this.renderLogContent(content, log)

    container.appendChild(header)
    container.appendChild(content)

    return container
  }

  renderLogContent(container, log) {
    switch (log.contentType) {
      case 'JSON':
        this.renderJsonContent(container, log.content)
        break
      case 'Mermaid':
        this.renderMermaidContent(container, log.content)
        break
      default:
        this.renderStringContent(container, log.content)
    }
  }

  renderJsonContent(container, content) {
    try {
      const jsonData = JSON.parse(content)
      const jsonViewer = document.createElement('json-viewer')
      jsonViewer.data = jsonData
      jsonViewer.style.cssText = `
        --json-viewer-color-key: #ff4438;
        --json-viewer-color-string: #dcff1e;
        --json-viewer-color-number: #80dbff;
        --json-viewer-color-boolean: #c795e3;
        --json-viewer-color-null: #b2b2b2;
        --json-viewer-background: transparent;
        --json-viewer-font-family: 'Space Mono', monospace;
      `
      container.appendChild(jsonViewer)
    } catch (error) {
      this.renderStringContent(container, `Invalid JSON: ${content}`)
    }
  }

  async renderMermaidContent(container, content) {
    const mermaidContainer = document.createElement('div')
    mermaidContainer.className = 'mermaid-diagram flex justify-center'

    try {
      const { svg } = await mermaid.render(`diagram-${Date.now()}`, content)
      mermaidContainer.innerHTML = svg

      // Fix the light grey text that's hard to see
      const svgElement = mermaidContainer.querySelector('svg')
      if (svgElement) {
        // Override the problematic #ccc color with dark text
        const style = document.createElement('style')
        style.textContent = `
          svg text, svg span, svg .label text, svg .label span {
            fill: #000000 !important;
            color: #000000 !important;
          }
        `
        svgElement.appendChild(style)
      }
    } catch (error) {
      mermaidContainer.className = 'text-red-400 bg-red-900/20 p-4 rounded border border-red-500'
      mermaidContainer.innerHTML = `
        <strong>Invalid Mermaid Diagram:</strong><br>
        <code class="text-xs">${error.message}</code><br><br>
        <strong>Content:</strong><br>
        <pre class="text-xs mt-2 overflow-auto">${content}</pre>
      `
    }

    container.appendChild(mermaidContainer)
  }

  renderStringContent(container, content) {
    // For single-line strings, use compact display
    const isMultiline = content.includes('\n')
    
    if (isMultiline) {
      const stringContainer = document.createElement('div')
      stringContainer.className = 'bg-redis-midnight p-4 rounded'
      stringContainer.innerHTML = `<pre class="text-redis-white whitespace-pre-wrap font-mono text-sm">${content}</pre>`
      container.appendChild(stringContainer)
    } else {
      const singleLineContainer = document.createElement('div')
      singleLineContainer.className = 'bg-redis-midnight px-4 py-2 rounded'
      singleLineContainer.innerHTML = `<span class="text-redis-white font-mono text-sm">${content}</span>`
      container.appendChild(singleLineContainer)
    }
  }
}

// Initialize the log viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LogViewer()
})
