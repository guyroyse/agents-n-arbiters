import azureFunctions from '@azure/functions'

import { version } from './version/version.js'

const { app } = azureFunctions

app.http('version', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'version',
  handler: version
})
