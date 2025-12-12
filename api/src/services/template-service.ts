import { PlayerTemplate, LocationTemplate, FixtureTemplate, ExitTemplate } from '@domain/templates/index.js'
import { Admin } from '@domain/admin.js'

class TemplateService {
  private constructor() {}

  static async create(): Promise<TemplateService> {
    return new TemplateService()
  }

  async clearAllTemplates(): Promise<void> {
    await Admin.clearAll()
  }

  async savePlayerTemplate(
    name: string,
    description: string,
    locationId: string,
    statuses?: string[],
    entityPrompt?: string
  ): Promise<void> {
    const template = PlayerTemplate.create(name, description, locationId, statuses, entityPrompt)
    await template.save()
  }

  async saveLocationTemplate(
    entityId: string,
    name: string,
    description: string,
    fixtureIds: string[],
    exitIds: string[],
    statuses?: string[],
    entityPrompt?: string
  ): Promise<void> {
    const template = LocationTemplate.create(entityId, name, description, fixtureIds, exitIds, statuses, entityPrompt)
    await template.save()
  }

  async saveFixtureTemplate(
    entityId: string,
    name: string,
    description: string,
    actions: string[],
    statuses?: string[],
    entityPrompt?: string
  ): Promise<void> {
    const template = FixtureTemplate.create(entityId, name, description, actions, statuses, entityPrompt)
    await template.save()
  }

  async saveExitTemplate(
    entityId: string,
    name: string,
    description: string,
    destinationId: string,
    statuses?: string[],
    entityPrompt?: string
  ): Promise<void> {
    const template = ExitTemplate.create(entityId, name, description, destinationId, statuses, entityPrompt)
    await template.save()
  }
}

export default await TemplateService.create()
