import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { VersionInfo } from '@ana/shared'
import responses from '../lib/http-responses.js'

export async function version(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a version request.')

  const versionInfo: VersionInfo = {
    name: 'Agents & Arbiters',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }

  return responses.ok(versionInfo)
}
