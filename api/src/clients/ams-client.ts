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

const AMS_BASE_URL = process.env.AMS_BASE_URL ?? 'http://localhost:8000'
const AMS_CONTEXT_WINDOW_MAX = process.env.AMS_CONTEXT_WINDOW_MAX ? parseInt(process.env.AMS_CONTEXT_WINDOW_MAX) : 4000

/**
 * Retrieve conversation history for a session
 */
export async function readWorkingMemory(sessionId: string, namespace: string): Promise<WorkingMemory> {
  const url = new URL(`/v1/working-memory/${sessionId}`, AMS_BASE_URL)
  url.searchParams.set('namespace', namespace)

  console.log(`[AMS GET] ${url.toString()}`)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Version': '0.12.0'
    }
  })

  if (response.status === 404) {
    console.log(`[AMS GET] Session not found, returning empty session`)
    return { session_id: sessionId, namespace, context: '', messages: [] }
  }

  if (!response.ok) {
    throw new Error(`Failed to get working memory: ${response.statusText}`)
  }

  return (await response.json()) as WorkingMemory
}

/**
 * Replace conversation history for a session
 */
export async function replaceWorkingMemory(
  sessionId: string,
  namespace: string,
  context: string,
  messages: ConversationMessage[]
): Promise<void> {
  const url = new URL(`/v1/working-memory/${sessionId}`, AMS_BASE_URL)
  url.searchParams.set('context_window_max', AMS_CONTEXT_WINDOW_MAX.toString())

  const replacement: WorkingMemory = { session_id: sessionId, namespace, context, messages }

  console.log(`[AMS PUT] ${url.toString()}`)

  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Version': '0.12.0'
    },
    body: JSON.stringify(replacement)
  })

  if (!response.ok) {
    throw new Error(`Failed to replace working memory: ${response.statusText}`)
  }
}

/**
 * Delete conversation history for a session
 */
export async function removeWorkingMemory(sessionId: string, namespace: string): Promise<void> {
  const url = new URL(`/v1/working-memory/${sessionId}`, AMS_BASE_URL)
  url.searchParams.set('namespace', namespace)

  console.log(`[AMS DELETE] ${url.toString()}`)

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Version': '0.12.0'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to delete working memory: ${response.statusText}`)
  }
}
