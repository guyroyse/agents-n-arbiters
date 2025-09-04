import azureFunctions from '@azure/functions'

import { version } from './functions/version.js'
import { takeTurn } from './functions/take-turn.js'

const { app } = azureFunctions

app.http('version', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'version',
  handler: version
})

app.http('takeTurn', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'take-turn',
  handler: takeTurn
})
