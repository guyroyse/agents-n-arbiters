import dedent from 'dedent'

export abstract class GameEntity {
  id = ''
  name = ''
  description = ''

  withId(id: string) {
    this.id = id
    return this
  }

  withName(name: string) {
    this.name = name
    return this
  }

  withDescription(description: string) {
    this.description = description
    return this
  }

  toJSON() {
    return { id: this.id, name: this.name, description: this.description }
  }
}

export class LocationEntity extends GameEntity {
  static create() {
    return new LocationEntity()
  }

  toJSON() {
    return {
      ...super.toJSON(),
      type: 'location'
    }
  }
}

export class FixtureEntity extends GameEntity {
  location = ''
  statuses: string[] = []
  actions: string[] = []

  static create() {
    return new FixtureEntity()
  }

  inLocation(locationId: string) {
    this.location = locationId
    return this
  }

  withStatus(status: string) {
    this.statuses.push(status)
    return this
  }

  withAction(action: string) {
    this.actions.push(action)
    return this
  }

  toJSON() {
    return { 
      ...super.toJSON(), 
      type: 'fixture',
      location: this.location, 
      statuses: this.statuses, 
      actions: this.actions 
    }
  }
}

export type GameEntities = GameEntity[]

export class GameState {
  gameId: string
  entities: GameEntities

  private constructor(gameId: string, entities: GameEntities) {
    this.gameId = gameId
    this.entities = entities
  }

  static create(gameId: string, entities: GameEntities) {
    return new GameState(gameId, entities)
  }

  toJSON() {
    return { gameId: this.gameId, entities: this.entities }
  }
}

export async function fetchGameState(gameId: string): Promise<GameState> {
  const locationEntity = LocationEntity.create().withId('ruined_shrine').withName('The Shrine of Forgotten Whispers')
    .withDescription(dedent`
      Ancient moss-covered stones form a crumbling circular shrine in the heart of a sun-dappled forest glade. 
      Wildflowers push through cracks in the weathered flagstones, while shafts of golden light pierce the 
      emerald canopy above. The air hums with an otherworldly tranquility, as if time itself moves slower in 
      this sacred space. Carved symbols, worn smooth by centuries of wind and rain, hint at rituals long 
      abandoned to memory.
    `)

  const statueFixture = FixtureEntity.create()
    .withId('ancient_statue')
    .withName('The Weeping Guardian')
    .withDescription(
      dedent`
      A towering figure carved from midnight-black stone stands sentinel at the shrine's center. Once-proud 
      features have been softened by ages of weathering, giving the mysterious deity an expression of eternal 
      sorrow. Intricate robes flow down the statue's form like frozen waterfalls, their folds deep enough to 
      hide secrets. Strange runes spiral around the base, pulsing faintly with an inner light when shadows 
      fall just right.
    `
    )
    .inLocation(locationEntity.id)
    .withStatus('covered in vines')
    .withStatus('intact')
    .withAction('knock over')
    .withAction('remove vines (if present)')
    .withAction('climb (if vines removed)')

  const altarFixture = FixtureEntity.create()
    .withId('crumbling_altar')
    .withName('The Altar of Echoes')
    .withDescription(
      dedent`
      A weathered stone altar sits before the guardian statue, its surface carved with intricate spirals and 
      celestial patterns. The top is stained dark with age, and shallow channels carved into the stone suggest 
      it once held offerings of some kind. Crystal formations have grown from cracks in the base, catching and 
      reflecting the filtered sunlight in prismatic rainbows. When the wind blows just right, the altar seems 
      to emit a low, haunting hum.
    `
    )
    .inLocation(locationEntity.id)

  const entities = [locationEntity, statueFixture, altarFixture]

  return GameState.create(gameId, entities)
}
