import azureFunctions from '@azure/functions'

import { loadTemplateHandler } from './admin/load-template.js'

const { app } = azureFunctions

app.http('load-template', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'admin/load-template',
  handler: loadTemplateHandler
})