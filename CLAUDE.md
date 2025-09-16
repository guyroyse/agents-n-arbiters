# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agents & Arbiters** is a multi-agent text adventure game built as a TypeScript monorepo using npm workspaces. The concept uses multiple AI agents (location, items, NPCs) to react to player input, with an arbiter synthesizing responses into a coherent game experience. Redis will store game state for persistence.

Current architecture:

- **`packages/ana-web/`** (@ana/web) - Svelte 5 frontend with terminal-style game interface
- **`packages/ana-api/`** (@ana/api) - Azure Functions v4 API with game loop endpoints
- **`packages/ana-admin/`** (@ana/admin) - Static admin interface for log viewing and template management
- **`packages/shared/`** - Shared TypeScript types and interfaces
- **`packages/agent-memory-server/`** - Containerized Agent Memory Server (Python-based placeholder)
- **`data/redis/`** - Persistent Redis data storage for local development
- **`infrastructure/`** - Infrastructure as Code (Bicep templates for Azure deployment)

## Current Implementation Status

### ✅ Completed

- **Basic game loop**: Terminal UI with command input and history display
- **API endpoints**: `/api/version` and `/api/take-turn` (currently echoes input with 1.5s delay)
- **Feature-based architecture**: Organized by views/features instead of component types
- **View-model pattern**: Centralized state management with proper encapsulation
- **Law of Demeter compliance**: Clean public interfaces hiding implementation details
- **Data access layer**: Centralized API functions in `services/api.ts`
- **Game state management**: History loading with mock data simulation
- **UI/UX features**: Auto-scrolling history, focus management, dual loading states
- **Modern JavaScript**: Private fields (#) and clean getter/setter patterns
- **Navigation system**: Complete routing between Welcome, NewGame, LoadGame, and Game views
- **Load game functionality**: List saved games with delete confirmation dialogs
- **Component architecture**: Modular components organized in folders with proper separation of concerns
- **Svelte 5 implementation**: Using runes ($state, $derived, $effect) throughout
- **Native dialog elements**: Semantic HTML with proper accessibility and form integration
- **Unified dialog system**: Consolidated Dialog, ConfirmationDialog, ErrorDialog with shared styling
- **Enhanced loading UX**: LoadingOverlay for initial loads, randomized thinking messages for command processing
- **Error handling**: Comprehensive ErrorDialog integration across views with retry functionality
- **Complete REST API**: Full Azure Functions backend with all CRUD operations for game management
- **HTTP response helpers**: Centralized response utilities eliminating boilerplate across all endpoints
- **Type-safe API layer**: Comprehensive request/response types with proper error handling using ApiError
- **Consistent naming**: Unified `gameId` naming convention throughout frontend and backend
- **Optimized API client**: Generic `apiCall` helper reducing code duplication by ~80%
- **Docker containerization**: Redis and Agent Memory Server configured for local development
- **Persistent data storage**: Redis data persists in `data/redis/` with proper .gitignore setup
- **Project documentation**: Comprehensive README.md with setup instructions and multi-agent collaboration overview
- **Redis integration**: Complete Redis client abstraction with local Docker and Azure Managed Redis support
- **Azure authentication**: Entra ID integration for passwordless AMR authentication in production
- **Environment configuration**: Unified REDIS_URL environment variable for both local and cloud deployments
- **Redis persistence**: Full game state persistence with RedisJSON and RediSearch
- **Game service architecture**: Class-based GameService with static factory pattern and private Redis client
- **Function organization**: Domain-based function organization with separate files and registration
- **Type safety**: Complete type definitions for Redis operations eliminating any types
- **Search optimization**: RediSearch index with 100-item limit and date-based sorting
- **Date handling**: Utility functions for ISO string ↔ Unix timestamp conversion
- **Multi-agent system**: Complete LangGraph.js implementation with dynamic graph construction
- **LLM integration**: OpenAI client with structured input/output using Zod schemas
- **Domain entities**: Class-based GameEntity, LocationEntity, and FixtureEntity with builder pattern
- **Rich game world**: Atmospheric descriptions for "The Shrine of Forgotten Whispers" with detailed fixtures
- **Intelligent routing**: LLM-powered classifier for agent selection with reasoning
- **Parallel execution**: Conditional fan-out supporting single or multiple agent execution
- **Agent input filtering**: Factory pattern for clean message filtering per agent type
- **Structured agent output**: All agents (classifier, location, fixture, arbiter) use Zod schemas for consistent output
- **Arbiter synthesis**: Fan-in node combining agent responses into final narrative with structured output
- **Dynamic graph building**: Class-based MultiAgentGraph with JavaScript private fields and factory patterns
- **Clean organization**: Domain-based folders (domain/, agent/, game/) with proper separation of concerns
- **Comprehensive logging system**: Structured logging with Redis streams and console output for debugging multi-agent workflows
- **GameState architecture**: Unified GameState class encapsulating gameId and entities with private constructor pattern
- **Dual logging strategy**: Azure context.log for infrastructure events, structured log() for business logic with gameId association
- **Rich log metadata**: TypeScript overloads supporting strings, JSON, Mermaid diagrams, and BaseMessages with metadata
- **Performance optimized logging**: Fire-and-forget Redis streams with error handling, non-blocking application flow
- **Multi-channel state architecture**: Custom GameTurnAnnotation replacing MessagesAnnotation for clean context engineering
- **Simplified agent patterns**: Direct function agents reading from dedicated state channels, eliminating message filtering complexity
- **Unified type system**: Centralized Zod schemas and TypeScript types in game-turn-state.ts for consistency across all agents
- **Structured agent reasoning**: Individual per-agent reasoning from classifier, enabling precise context extraction
- **Complete GameTurnAnnotation migration**: All agents (classifier, location, fixture, arbiter) updated to use multi-channel state pattern
- **Entity type awareness**: JSON serialization includes entity types for improved classifier decision-making
- **Enhanced logging**: Improved logger handles arrays, objects with toJSON(), and null/undefined values safely
- **Structured agent contributions**: Agents provide structured output prepared for future state change capabilities
- **Redis-based domain entities**: Complete refactoring of domain objects to load from Redis with game-specific and template fallback patterns
- **Entity hierarchy**: Separated GameEntity, PlayerEntity, LocationEntity, FixtureEntity into individual files with proper inheritance
- **Template management system**: Admin interface for loading world templates with Redis storage using `template:entity:*` keyspace
- **Batch entity loading**: Optimized Redis operations using JSON.MGET for efficient fixture loading
- **Admin dashboard**: Complete admin interface (@ana/admin) with log viewer and world template management capabilities

### 🚧 Next Steps

- **Add state change capabilities**: Extend agent schemas to include state modifications (statusesAdded, statusesRemoved, etc.)
- **Build committer component**: Handle state changes from arbiter output and update game entities
- Add NPC agent types and implementations
- Deploy to Azure with AMR and Azure Container Apps

## Development Commands

### Full-stack Development

```bash
docker compose up     # Start Redis + Agent Memory Server containers
npm run dev           # Build all packages, then start SWA + Functions in parallel
```

### Individual Package Development

```bash
npm run dev --workspace=@ana/web      # SWA CLI with Functions integration
npm run dev --workspace=@ana/api      # Azure Functions Core Tools (standalone)
```

### Build Commands

```bash
npm run build         # Build all packages in parallel
npm run build --workspace=@ana/web    # Vite production build
npm run build --workspace=@ana/api    # TypeScript compilation to dist/
```

### Type Checking

```bash
npm run check --workspace=@ana/web    # Svelte + TypeScript checking
```

## Architecture Details

### Monorepo Structure

- **Root level tooling**: Azure SWA CLI, Azure Functions Core Tools, npm-run-all orchestration
- **Package isolation**: Each package has independent dependencies and build processes
- **Workspace scripts**: Root orchestrates via `npm-run-all --parallel/--sequential`

### Frontend Architecture (@ana/web)

- **Feature-based organization**: `views/game/`, `views/load-game/`, etc. contain related components and ViewModels
- **Shared components**: `components/` with dialogs, LoadingOverlay, Header, Footer for reusable UI elements
- **Dialog system**: Unified base Dialog component with ConfirmationDialog and ErrorDialog specializations
- **API layer**: `services/api.ts` for centralized external service calls and data access
- **Path aliases**: `@views/`, `@components/`, `@services/`, `@app/` for clean imports
- **ViewModel pattern**: Centralized state management with Svelte 5 runes and private fields
- **Dual loading states**: Separate tracking for history loading vs command processing with distinct UX
- **Law of Demeter**: Components interact only with ViewModel public interfaces
- **Autonomous components**: LoadGameCard, LoadGameEmpty handle their own navigation without prop drilling
- **Component extraction**: Complex views broken down into focused, reusable sub-components

### TypeScript Configuration Strategy

Both packages share aligned linting standards but different compilation targets:

- **@ana/web**: Bundler mode (`moduleResolution: "bundler"`) with Vite, no emit
- **@ana/api**: Node.js mode (`moduleResolution: "node"`) with compilation to `dist/`
- **Shared settings**: ES2022 target, strict linting, isolated modules, verbatim module syntax

### Azure Static Web Apps Integration

- **Local development**: SWA CLI proxies `/api/*` requests to Azure Functions on port 7071
- **Production routing**: Configured via `staticwebapp.config.json` with asset exclusions
- **API access**: Functions available at `/api/version` and `/api/take-turn` through SWA

### Styling System

- **Tailwind CSS v4** with custom Redis-themed color palette
- **Custom fonts**: Space Grotesk (sans) and Space Mono (mono) via Google Fonts
- **CSS variables**: Extensive Redis brand colors (redis-midnight, redis-hyper, etc.)

### Container Architecture

- **Redis**: Latest Redis image with persistence to `./data/redis` volume
- **Agent Memory Server**: Python 3.12-based container (placeholder HTTP server on port 8000)
- **Local development**: `docker-compose.yml` orchestrates both services with health checks
- **Future deployment**: Azure Container Apps for AMS, Azure Managed Redis for production

### Logging Architecture

- **Dual logging strategy**: Infrastructure vs business logic separation
  - `context.log()` for Azure Functions HTTP endpoint logging (Azure monitoring integration)
  - `log(gameId, prefix, content)` for game-specific business logic (Redis streams with session association)
- **Structured log function**: TypeScript overloads support different content types:
  - Strings: Direct text logging
  - JSON objects: Pretty-printed structured data
  - BaseMessages: LangChain message objects with metadata (type, name, index)
  - Mermaid diagrams: Workflow visualization from LangGraph
- **Redis streams**: Game-specific logs stored in `saved:game:{gameId}:log` with rich metadata
- **Performance**: Fire-and-forget logging with Promise-based Redis operations, non-blocking
- **GameState integration**: All business logic logging includes gameId for session tracking
- **Log metadata**: Structured fields include contentType, messageType, messageName, messageIndex for filtering

## Environment Configuration

### Node.js Version Management

- Project uses Node.js v20.x (specified in `.nvmrc`)
- Run `nvm use` to switch to the correct version before development
- Required for Azure Functions v4 compatibility

### Azure Functions Local Development

- Copy `packages/ana-api/local.settings.example.json` to `packages/ana-api/local.settings.json`
- Environment variables accessible via `process.env.NODE_ENV`

### Static Web App Environment Variables

- Build-time only via Vite: `import.meta.env.VITE_*`
- No runtime server-side variables (static files served from CDN)

## Key Technical Constraints

- **ES Modules**: All packages use `"type": "module"` for consistency
- **Azure Functions v4**: Modern programming model with `app.http()` registration
- **Svelte 5**: No SvelteKit - plain Svelte with Vite bundler
- **No global installations**: All tooling installed locally via npm workspaces
