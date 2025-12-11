import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import type { LoadTemplateRequest, LoadTemplateResponse } from '@ana/types'
import responses from '@functions/http-responses.js'
import templateService from '@services/template-service.js'

export async function loadTemplate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    context.log('HTTP trigger function processed a load-template request.')

    const templateData = (await request.json()) as LoadTemplateRequest

    // Validate required fields
    if (!templateData) return responses.badRequest('Template data is required')
    if (!templateData.player || !templateData.entities)
      return responses.badRequest('Template data must include player and entities')

    // Clear all existing templates
    await templateService.clearAllTemplates()

    // Save player template
    await templateService.savePlayerTemplate(templateData.player)

    // Save all entity templates
    for (const entity of templateData.entities) {
      switch (entity.entityType) {
        case 'location':
          await templateService.saveLocationTemplate(entity)
          break
        case 'fixture':
          await templateService.saveFixtureTemplate(entity)
          break
        case 'exit':
          await templateService.saveExitTemplate(entity)
          break
      }
    }

    context.log(`Template entities loaded successfully! (1 player, ${templateData.entities.length} entities)`)

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
