import azureFunctions from '@azure/functions'

import { loadTemplate } from './admin/load-template.js'

const { app } = azureFunctions

app.http('loadTemplate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'load-template',
  handler: loadTemplate
})
