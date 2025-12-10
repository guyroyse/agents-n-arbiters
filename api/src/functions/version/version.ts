import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { VersionInfo } from '@ana/types'
import responses from '@functions/http-responses.js'

export async function version(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a version request.')

  const versionInfo: VersionInfo = {
    name: 'Agents & Arbiters',
    version: '1.0.0'
  }

  return responses.ok(versionInfo)
}
