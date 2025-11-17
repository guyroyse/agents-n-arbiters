import { DefaultAzureCredential } from '@azure/identity'

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

export class AmsClient {
  static #instance: AmsClient

  #baseUrl: string
  #contextWindowMax: number
  #credential?: DefaultAzureCredential
  #amsScope?: string

  private constructor(baseUrl: string, contextWindowMax: number) {
    this.#baseUrl = baseUrl
    this.#contextWindowMax = contextWindowMax

    // Initialize Azure credentials for production
    if (process.env.NODE_ENV !== 'development') {
      this.#credential = new DefaultAzureCredential()
      this.#amsScope = process.env.AMS_SCOPE ?? 'api://agents-arbiters-ams/.default'
    }
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
   * Get authentication headers (includes Bearer token in production)
   */
  async #getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Add OAuth2 token in production
    if (this.#credential && this.#amsScope) {
      const token = await this.#credential.getToken(this.#amsScope)
      headers['Authorization'] = `Bearer ${token.token}`
    }

    return headers
  }

  /**
   * Retrieve conversation history for a session
   */
  async readWorkingMemory(sessionId: string, namespace: string): Promise<WorkingMemory> {
    const url = new URL(`/v1/working-memory/${sessionId}`, this.#baseUrl)
    url.searchParams.set('namespace', namespace)

    const headers = await this.#getAuthHeaders()
    headers['X-Client-Version'] = '0.12.0'

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Return empty session for new users
        console.log(`[AMS GET] Session not found, returning empty session`)
        return { session_id: sessionId, namespace: namespace, context: '', messages: [] }
      }
      throw new Error(`Failed to get working memory: ${response.statusText}`)
    }

    return (await response.json()) as WorkingMemory
  }

  /**
   * Replace conversation history for a session
   */
  async replaceWorkingMemory(
    sessionId: string,
    namespace: string,
    context: string,
    messages: ConversationMessage[]
  ): Promise<void> {
    const url = new URL(`/v1/working-memory/${sessionId}`, this.#baseUrl)
    url.searchParams.set('context_window_max', this.#contextWindowMax.toString())

    const replacement: WorkingMemory = { session_id: sessionId, namespace, context, messages }

    const headers = await this.#getAuthHeaders()

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers,
      body: JSON.stringify(replacement)
    })

    if (!response.ok) throw new Error(`Failed to replace working memory: ${response.statusText}`)
  }

  /**
   * Delete conversation history for a session
   */
  async removeWorkingMemory(sessionId: string, namespace: string): Promise<void> {
    const url = new URL(`/v1/working-memory/${sessionId}`, this.#baseUrl)
    url.searchParams.set('namespace', namespace)

    const headers = await this.#getAuthHeaders()

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers
    })

    if (!response.ok) {
      throw new Error(`Failed to delete working memory: ${response.statusText}`)
    }
  }
}
