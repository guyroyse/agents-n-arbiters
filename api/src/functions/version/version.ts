import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { FetchVersionResponse } from '@api-types/response.js'
import responses from '@functions/http-responses.js'

export async function version(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a version request.')

  const response: FetchVersionResponse = {
    name: 'Agents & Arbiters',
    version: '1.0.0'
  }

  return responses.ok(response)
}
