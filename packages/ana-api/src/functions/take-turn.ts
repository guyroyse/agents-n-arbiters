import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { TakeTurnRequest, TakeTurnResponse } from '@ana/shared'

export async function takeTurn(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a take-turn request.')
  
  try {
    const body = await request.json() as TakeTurnRequest
    const { savedGameId, command } = body
    
    // For now, just echo back the command
    const response: TakeTurnResponse = {
      savedGameId,
      command,
      result: `You typed: ${command}`
    }
    
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: response
    }
  } catch (error) {
    context.error('Error processing take-turn request:', error)
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: { error: 'Invalid request format' }
    }
  }
}