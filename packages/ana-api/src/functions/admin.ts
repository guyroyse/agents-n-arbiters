import azureFunctions from '@azure/functions'

import { loadTemplateHandler } from './admin/load-template.js'

const { app } = azureFunctions

app.http('loadTemplate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'load-template',
  handler: loadTemplateHandler
})
