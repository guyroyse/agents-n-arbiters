import type { VersionData } from '@api-types/response'
import { fetchVersionInfo } from '@services/api'

export default class FooterViewModel {
  #versionInfo = $state<VersionData | null>(null)
  #loading = $state(true)
  #error = $state<string | null>(null)

  get versionInfo() {
    return this.#versionInfo
  }

  get loading() {
    return this.#loading
  }

  get error() {
    return this.#error
  }

  async loadVersionInfo() {
    this.#loading = true
    this.#error = null

    try {
      this.#versionInfo = await fetchVersionInfo()
    } catch (err) {
      this.#error = err instanceof Error ? err.message : 'Failed to fetch version info'
    } finally {
      this.#loading = false
    }
  }
}
