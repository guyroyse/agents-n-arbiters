import { app, HttpRequest, type HttpResponseInit, InvocationContext } from '@azure/functions'

interface VersionResponse {
  name: string
  version: string
  timestamp: string
  environment: string
}

export async function version(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a version request.')

  const versionInfo: VersionResponse = {
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

app.http('version', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'version',
  handler: version
})
