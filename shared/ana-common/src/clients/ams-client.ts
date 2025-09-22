export type ConversationMessage = {
  role: string
  content: string
}

export type WorkingMemory = {
  session_id: string
  namespace: string
  context: string
  messages: ConversationMessage[]
}

type WorkingMemoryReplacement = {
  namespace: string
  messages: ConversationMessage[]
  context_window_max: number
}

export class AmsClient {
  static #instance: AmsClient

  #baseUrl: string
  #contextWindowMax: number

  private constructor(baseUrl: string, contextWindowMax: number) {
    this.#baseUrl = baseUrl
    this.#contextWindowMax = contextWindowMax
  }

  static instance(): AmsClient {
    if (!AmsClient.#instance) {
      const baseUrl = process.env.AMS_BASE_URL ?? 'http://localhost:8000'
      const contextWindowMax = process.env.AMS_CONTEXT_WINDOW_MAX ? parseInt(process.env.AMS_CONTEXT_WINDOW_MAX) : 4000
      this.#instance = new AmsClient(baseUrl, contextWindowMax)
    }

    return AmsClient.#instance
  }

  /**
   * Retrieve conversation history for a session
   */
  async readWorkingMemory(sessionId: string, namespace: string): Promise<WorkingMemory> {
    const url = new URL(`/v1/working-memory/${sessionId}`, this.#baseUrl)
    url.searchParams.set('namespace', namespace)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) throw new Error(`Failed to get working memory: ${response.statusText}`)

    return (await response.json()) as WorkingMemory
  }

  /**
   * Replace conversation history for a session
   */
  async replaceWorkingMemory(sessionId: string, namespace: string, messages: ConversationMessage[]): Promise<void> {
    const url = `${this.#baseUrl}/v1/working-memory/${sessionId}`

    const replacement: WorkingMemoryReplacement = {
      namespace,
      messages,
      context_window_max: this.#contextWindowMax
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(replacement)
    })

    if (!response.ok) {
      throw new Error(`Failed to replace working memory: ${response.statusText}`)
    }
  }

  /**
   * Delete conversation history for a session
   */
  async removeWorkingMemory(sessionId: string, namespace: string): Promise<void> {
    const url = new URL(`/v1/working-memory/${sessionId}`, this.#baseUrl)
    url.searchParams.set('namespace', namespace)

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Failed to delete working memory: ${response.statusText}`)
    }
  }
}
