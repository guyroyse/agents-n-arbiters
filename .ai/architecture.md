# Architecture Guidelines

## Layered Architecture

The application follows a strict layered architecture:

```
Functions → Services → Domain Objects → Clients
```

### Function Layer (`api/src/functions/`)

- **Responsibility:** HTTP concerns (parsing requests, building responses)
- **Accepts:** Request types from `@ana/types`
- **Returns:** Response types from `@ana/types`
- **Pattern:**
  1. Parse Request type from HTTP body
  2. Call service with discrete parameters
  3. Receive domain objects from service
  4. Map domain object properties to Response type
  5. Return Response type via `responses.ok()`, `responses.created()`, etc.

### Service Layer (`api/src/services/`)

- **Responsibility:** Business logic and orchestration
- **Accepts:** Discrete parameters (primitives, not Request types)
- **Returns:** Domain objects OR void
- **Pattern:**
  - For queries: Return domain objects
  - For commands: Accept discrete parameters, return domain object or void
  - No knowledge of Request/Response types
  - Orchestrates domain objects and clients

### Domain Layer (`api/src/domain/`)

- **Responsibility:** Business entities and their behavior
- **Pattern:**
  - Private constructors
  - Static factory methods (`create()`, `fetch()`, `fetchAll()`)
  - Instance methods for persistence (`save()`)
  - Public getters/setters for properties
  - Encapsulate Redis operations
  - Module-level Redis client and infrastructure setup

### Client Layer (`api/src/clients/`)

- **Responsibility:** External service communication
- **Pattern:**
  - Redis, LLM, AMS clients
  - Simple functions or singleton instances
  - No business logic

## Type System

### Request Types (`types/src/types/request.ts`)

- Define HTTP request body shapes
- Include template data types for admin interface
- Used by **function layer** to parse input
- Used by **web/admin clients** to build requests
- Examples: `CreateGameRequest`, `TakeGameTurnRequest`, `LoadTemplateRequest`
- Template types: `TemplateData`, `PlayerTemplateData`, `EntityTemplateData`, etc.

### Response Types (`types/src/types/response.ts`)

- Define HTTP response body shapes
- Include data types used in responses (with `Data` suffix)
- Used by **function layer** to construct output
- Used by **web/admin clients** to type responses and local state
- Response types: `CreateGameResponse`, `FetchGamesResponse`, etc.
- Data types: `SavedGameData`, `GameTurnData`, `GameLogData`, `VersionData`, `LoadTemplateData`
- **NOTE**: Backend uses domain objects internally, NOT these data types

## Key Principles

1. **Services return domain objects, not plain data**
   - Services orchestrate domain objects
   - Functions map domain objects to Response types

2. **Functions handle HTTP translation**
   - Parse Request types from HTTP
   - Map domain objects to Response types
   - No `.toJSON()` needed on domain objects

3. **Services accept discrete parameters**
   - Not Request types
   - Not domain objects (for mutations)
   - Simple primitives that express intent

4. **Domain objects encapsulate persistence**
   - Redis client at module level
   - Infrastructure setup (indexes) at module level
   - Business logic in class methods

## Example: Create Game Flow

```typescript
// Function layer (create-game.ts)
export async function createGame(request: HttpRequest): Promise<HttpResponseInit> {
  const { gameName } = await request.json() as CreateGameRequest

  const gameId = ulid()
  const savedGame = await gameService.saveGame(gameId, gameName.trim(), new Date().toISOString())

  const response: CreateGameResponse = {
    gameId: savedGame.gameId,
    gameName: savedGame.gameName,
    lastPlayed: savedGame.lastPlayed
  }

  return responses.created(response)
}

// Service layer (game-service.ts)
async saveGame(gameId: string, gameName: string, lastPlayed: string): Promise<SavedGame> {
  const savedGame = await SavedGame.create(gameId, gameName, lastPlayed)
  await savedGame.save()
  return savedGame
}

// Domain layer (saved-game.ts)
export class SavedGame {
  static async create(gameId: string, gameName: string, lastPlayed: string): Promise<SavedGame> {
    return new SavedGame(gameId, gameName, lastPlayed)
  }

  async save(): Promise<void> {
    await redisClient.json.set(key, '$', redisGame)
  }
}
```

## Domain Objects

### Current Domain Objects

- **SavedGame** - Game metadata (gameId, gameName, lastPlayed) with RediSearch index
- **GameTurn** - Turn history stored in Redis Streams
- **GameLog** - Structured logging to Redis Streams with content type support
- **Admin** - System-level operations (clearAll)
- **Templates** - PlayerTemplate, LocationTemplate, FixtureTemplate, ExitTemplate with base class

### Domain Object Patterns

- **Private constructors** - Prevent direct instantiation
- **Static factory methods** - `create()`, `fetch()`, `fetchAll()`
- **Instance methods** - `save()`, `toJSON()`
- **Module-level setup** - Redis client and index creation at module load
- **On-demand index creation** - `ensureIndex()` called before searches to handle missing indexes

### Example: SavedGame with Index Management

```typescript
// Module-level Redis client
const redisClient = await fetchRedisClient()

// Module-level helper for index management
async function ensureIndex(): Promise<void> {
  try {
    await redisClient.ft.info(INDEX_NAME)
  } catch (error) {
    // Index doesn't exist, create it
    await redisClient.ft.create(INDEX_NAME, schema, options)
  }
}

export class SavedGame {
  static async fetchAll(): Promise<SavedGame[]> {
    await ensureIndex()  // Ensure index exists before searching
    const result = await redisClient.ft.search(INDEX_NAME, '*', {...})
    return result.documents.map(doc => new SavedGame(...))
  }
}
```

## Frontend Architecture

### Feature-Based Organization

Views are organized by feature with co-located components and ViewModels:

```
web/src/views/
  game/                    - Main game play view
    Game.svelte
    game-view-model.svelte.ts
  load-game/              - Game selection view
    LoadGame.svelte
    LoadGameCard.svelte
    LoadGameList.svelte
    LoadGameEmpty.svelte
    load-game-view-model.svelte.ts
  load-template/          - Template loading view
    LoadTemplate.svelte
    load-template-view-model.svelte.ts
  game-log/               - Log viewer
    GameLog.svelte
    GameLogEntry.svelte
    game-log-view-model.svelte.ts
```

### ViewModel Pattern

ViewModels manage state and business logic using Svelte 5 runes:

```typescript
export class GameViewModel {
  #gameId = $state<string>('')
  #history = $state<GameTurnData[]>([])
  #isLoadingHistory = $state(false)
  #isProcessingCommand = $state(false)

  // Public getters
  get gameId() {
    return this.#gameId
  }
  get history() {
    return this.#history
  }
  get isLoadingHistory() {
    return this.#isLoadingHistory
  }
  get isProcessingCommand() {
    return this.#isProcessingCommand
  }

  // Public methods
  async loadHistory(gameId: string) {
    this.#isLoadingHistory = true
    try {
      const turns = await api.fetchGameTurns(gameId)
      this.#history = turns
    } finally {
      this.#isLoadingHistory = false
    }
  }
}
```

### Component Patterns

- **Law of Demeter** - Components only interact with ViewModel public interfaces
- **Autonomous components** - Components handle their own navigation without prop drilling
- **Component extraction** - Break complex views into focused, reusable sub-components
- **Dual loading states** - Separate tracking for history loading vs command processing

### API Layer

Centralized API client in `web/src/services/api.ts`:

```typescript
export const api = {
  async createGame(gameName: string): Promise<CreateGameResponse> {
    const response = await fetch('/api/games', {
      method: 'POST',
      body: JSON.stringify({ gameName })
    })
    return response.json()
  }
}
```

### Routing

App router with enum-based routes:

```typescript
export enum Route {
  WELCOME = 'welcome',
  GAME = 'game',
  LOAD_GAME = 'load-game',
  LOAD_TEMPLATE = 'load-template',
  GAME_LOG = 'game-log'
}

export class AppRouter {
  #currentRoute = $state<Route>(Route.WELCOME)
  #params = $state<Record<string, string>>({})

  navigate(route: Route, params?: Record<string, string>) {
    this.#currentRoute = route
    this.#params = params ?? {}
  }
}
```
