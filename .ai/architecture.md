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

## Current Refactoring Status

- ✅ SavedGame domain object created
- ✅ game-service refactored to use SavedGame domain object
- ✅ Functions updated to call domain object methods
- ⏳ Functions still call `.toJSON()` - need to map to Response types directly
- ⏳ game-service still imports API types - should be removed
- ⏳ Turns and logs still use direct Redis - need domain objects
