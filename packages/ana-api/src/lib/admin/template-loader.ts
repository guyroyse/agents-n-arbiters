import dedent from 'dedent'
import { fetchRedisClient } from '@clients/redis-client.js'
import type { PlayerTemplate, LocationTemplate, FixtureTemplate, TemplateData } from '@ana/shared'

const player: PlayerTemplate = {
  entityId: 'player',
  entityType: 'player',
  name: 'Adventurer',
  description: 'A brave soul seeking adventure',
  locationId: 'ruined_shrine'
}

const ruinedShrine: LocationTemplate = {
  entityId: 'ruined_shrine',
  entityType: 'location',
  name: 'The Shrine of Forgotten Whispers',
  description: dedent`
    Ancient moss-covered stones form a crumbling circular shrine in the heart of a sun-dappled forest glade. 
    Wildflowers push through cracks in the weathered flagstones, while shafts of golden light pierce the 
    emerald canopy above. The air hums with an otherworldly tranquility, as if time itself moves slower in 
    this sacred space. Carved symbols, worn smooth by centuries of wind and rain, hint at rituals long 
    abandoned to memory.
  `,
  fixtureIds: ['ancient_statue', 'crumbling_altar']
}

const ancientStatue: FixtureTemplate = {
  entityId: 'ancient_statue',
  entityType: 'fixture',
  name: 'The Weeping Guardian',
  description: dedent`
    A towering figure carved from midnight-black stone stands sentinel at the shrine's center. Once-proud 
    features have been softened by ages of weathering, giving the mysterious deity an expression of eternal 
    sorrow. Intricate robes flow down the statue's form like frozen waterfalls, their folds deep enough to 
    hide secrets. Strange runes spiral around the base, pulsing faintly with an inner light when shadows 
    fall just right.
  `,
  statuses: ['covered in vines', 'intact'],
  actions: ['knock over', 'remove vines (if present)', 'climb (if vines removed)']
}

const crumblingAltar: FixtureTemplate = {
  entityId: 'crumbling_altar',
  entityType: 'fixture',
  name: 'The Altar of Echoes',
  description: dedent`
    A weathered stone altar sits before the guardian statue, its surface carved with intricate spirals and 
    celestial patterns. The top is stained dark with age, and shallow channels carved into the stone suggest 
    it once held offerings of some kind. Crystal formations have grown from cracks in the base, catching and 
    reflecting the filtered sunlight in prismatic rainbows. When the wind blows just right, the altar seems 
    to emit a low, haunting hum.
  `,
  statuses: [],
  actions: []
}

const stockTemplate: TemplateData = {
  player,
  entities: [ruinedShrine, ancientStatue, crumblingAltar]
}

export async function loadTemplate(template?: TemplateData): Promise<void> {
  const redisClient = await fetchRedisClient()

  const selectedTemplate = template ?? stockTemplate

  // Clear existing templates
  for await (const key of redisClient.scanIterator({ MATCH: 'template:entity:*' })) {
    redisClient.del(key)
  }

  // Save player template
  await redisClient.json.set('template:entity:player', '$', selectedTemplate.player)

  // Save all other entities
  for (const entity of selectedTemplate.entities) {
    await redisClient.json.set(`template:entity:${entity.entityId}`, '$', entity)
  }

  console.log(`Template entities loaded successfully! (1 player, ${selectedTemplate.entities.length} entities)`)
}
