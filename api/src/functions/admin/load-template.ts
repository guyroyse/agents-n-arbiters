import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { LoadTemplateRequest, LoadTemplateResponse } from '@ana/types'
import responses from '@functions/http-responses.js'
import { loadTemplate } from '@services/template-service.js'

export async function loadTemplateHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    context.log('HTTP trigger function processed a load-template request.')

    // Parse the request body
    const templateData = (await request.json()) as LoadTemplateRequest

    if (!templateData) {
      return responses.badRequest('Template data is required')
    }

    // Validate required fields
    if (!templateData.player || !templateData.entities) {
      return responses.badRequest('Template data must include player and entities')
    }

    await loadTemplate(templateData)

    context.log('Template entities loaded successfully!')

    const response: LoadTemplateResponse = {
      message: 'Template entities loaded successfully!',
      timestamp: new Date().toISOString(),
      entitiesLoaded: {
        player: 1,
        entities: templateData.entities.length
      }
    }

    return responses.ok(response)
  } catch (error) {
    context.error('Error loading template entities:', error)
    return responses.serverError('Failed to load template entities')
  }
}
