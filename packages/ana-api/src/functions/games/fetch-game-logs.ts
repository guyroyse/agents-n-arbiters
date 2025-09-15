import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

import responses from '@functions/http-responses.js'
import { fetchRedisClient } from '@clients/redis-client.js'

export async function fetchGameLogs(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a fetch game logs request.')

  try {
    const gameId = request.params.gameId
    if (!gameId) return responses.badRequest('Game ID is required')

    // Parse count parameter
    const url = new URL(request.url)
    const count = parseInt(url.searchParams.get('count') ?? '50')

    // Validate count
    if (count < 1 || count > 1000) {
      return responses.badRequest('Count must be between 1 and 1000')
    }

    const client = await fetchRedisClient()
    const streamKey = `saved:game:${gameId}:log`

    // Use XREVRANGE to get logs in reverse chronological order (newest first)
    const logs = await client.xRevRange(streamKey, '+', '-', { COUNT: count })

    // Transform Redis stream entries to a more usable format
    const logEntries = logs.map(entry => ({
      id: entry.id,
      timestamp: parseInt(entry.id.split('-')[0]),
      ...entry.message
    }))

    return responses.ok(logEntries)

  } catch (error) {
    context.error('Error fetching game logs:', error)
    return responses.serverError('Failed to fetch game logs')
  }
}