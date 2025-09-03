import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { VersionInfo } from '@ana/shared'

export async function version(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a version request.')

  const versionInfo: VersionInfo = {
    name: 'agents-n-arbiters-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  }

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    jsonBody: versionInfo
  }
}
