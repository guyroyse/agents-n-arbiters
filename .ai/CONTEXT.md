# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agents & Arbiters** is a multi-agent text adventure game built as a TypeScript monorepo using npm workspaces. The concept uses multiple AI agents (location, items, NPCs) to react to player input, with an arbiter synthesizing responses into a coherent game experience. Redis will store game state for persistence.

Current architecture:

- **`types/`** (@ana/types) - Pure TypeScript types and Zod schemas
- **`api/`** (@ana/api) - Azure Functions v4 API endpoints
- **`web/`** (@ana/web) - Svelte 5 frontend with terminal-style game interface
- **`templates/`** - World template JSON files for game initialization
- **`infra/`** - Infrastructure as Code (Bicep templates for Azure deployment)

## Current Implementation Status

### ✅ Working Systems

- **Multi-agent game engine**: Complete LangGraph.js workflow with classifier → agents → arbiter → committer → narrator flow
- **Game interfaces**: Web frontend (port 4280) with game play, log viewing, and template loading; API backend (port 7071)
- **Persistent state**: Redis-backed entities with game save/load, template management, and structured logging
- **Agent types**: Location, fixture, player, exit, and arbiter agents with entity-specific prompts and change-focused behavior
- **Movement system**: Exit agents handle player location changes with validation and proper state transitions
- **Game world**: "The Shrine of Forgotten Whispers" expanded with interconnected locations and movement paths
- **State management**: Multi-channel GameTurnAnnotation system with structured change recommendations and entity persistence
- **Narrative generation**: Dedicated narrator agent for post-committer storytelling with concise, atmospheric responses
- **Agent Memory Server integration**: Complete AMS integration with narrator agent for persistent conversation history and narrative continuity
- **Spatial awareness**: Narrator always provides location name and available exits for consistent player orientation

### 🚧 Next Priorities

- Add item entities and item agent types
- Add NPC agent types and implementations
- Deploy to Azure with AMS and Azure Container Apps

## Development Commands

### Initial Setup

```bash
cp .env.example .env                                                     # Copy environment configuration and add your OpenAI API key
docker compose up                                                        # Start Redis + Agent Memory Server containers
npm install                                                              # Install all workspace dependencies
cp functions/ana-api/local.settings.example.json functions/ana-api/local.settings.json  # Copy Azure Functions local settings and add your API key
```

### Full-stack Development

```bash
npm run dev           # Build all packages, then start all services in parallel (web:4280, api:7071)
```

### Individual Package Development

```bash
npm run dev --workspace=@ana/web      # SWA CLI with Functions integration (port 4280)
npm run dev --workspace=@ana/api      # Azure Functions Core Tools (port 7071)
```

### Build Commands

```bash
npm run build                         # Build all packages in dependency order (types first, then web/api in parallel)
npm run build --workspace=@ana/types  # TypeScript compilation for shared types
npm run build --workspace=@ana/web    # Vite production build
npm run build --workspace=@ana/api    # TypeScript compilation to dist/ with tsc-alias
```

### Type Checking and Code Quality

```bash
npm run check --workspace=@ana/web    # Svelte + TypeScript checking for frontend
# Note: No linting or testing infrastructure currently configured
```

### Container Management

```bash
docker compose up -d                  # Start containers in background
docker compose logs redis             # View Redis logs
docker compose logs agent-memory-server  # View AMS logs
docker compose down                   # Stop and remove containers
```

## Architecture Details

### Monorepo Structure

- **Root level tooling**: Azure SWA CLI, Azure Functions Core Tools, npm-run-all orchestration
- **Package isolation**: Each package has independent dependencies and build processes
- **Workspace scripts**: Root orchestrates via `npm-run-all --parallel/--sequential`

### Layered Package Architecture

The monorepo follows a clean layered architecture with explicit dependency flow:

```
@ana/types (no dependencies)
    ↓
@ana/common (depends on: types)
    ↓
@ana/domain (depends on: types, common)
    ↓
@ana/agents (depends on: types, common, domain)
    ↓
@ana/api (depends on: all packages)

@ana/web (depends on: types only)
@ana/admin (depends on: types only)
```

**Benefits of this architecture:**

- **No circular dependencies**: Clear unidirectional dependency flow
- **Reusability**: Each layer can be consumed independently by other services
- **Testability**: Lower layers can be tested in isolation
- **Azure compatibility**: All dependencies bundle correctly during deployment
- **Modularity**: Clean separation of concerns across the system

**Package responsibilities:**

- **@ana/types**: Pure type definitions and Zod schemas (no runtime dependencies)
- **@ana/api**: API endpoints (Azure Functions with domain logic, Redis/LLM clients, and utilities)
- **@ana/web**: Frontend application (Svelte 5, consumes types only, communicates via API)

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

### Multi-Agent System Architecture (@ana/agents)

The core innovation is the multi-agent collaboration system built with LangGraph.js and now extracted to its own package:

- **Game Turn Flow**: `/api/take-turn` endpoint orchestrates the complete multi-agent workflow
- **LangGraph Implementation**: `MultiAgentGraph` class in `@ana/agents` constructs dynamic execution graphs
- **Agent Types**:
  - `classifier` - LLM-powered routing to determine which agents should respond
  - `location-agent` - Analyzes location-specific state changes and atmospheric effects
  - `fixture-agent` - Handles interactive object state changes and responses
  - `player-agent` - Manages player status, abilities, and introspection changes
  - `exit-agent` - Handles movement logic and location transitions
  - `arbiter` - Processes change recommendations and resolves conflicts
  - `committer` - Applies validated entity changes and persists to Redis
  - `narrator` - Generates concise narrative responses after state changes

### Multi-Channel State Management

- **GameTurnAnnotation**: Custom LangGraph annotation replacing MessagesAnnotation for clean context engineering
- **Dedicated State Channels**: Each agent reads from specific state channels (classifier_reasoning, entities, player_input, etc.)
- **Domain Entities**: Redis-backed `GameEntity`, `LocationEntity`, `FixtureEntity`, `PlayerEntity`, `ExitEntity` with template fallback patterns
- **State Change System**: Set-based status management with entity persistence and LLM-safe JSON serialization

### Entity and Prompt System

- **Entity Hierarchy**: Base `GameEntity` class with specialized subclasses for different game object types
- **Template Management**: Admin interface for loading world templates into Redis (`template:entity:*` keyspace)
- **Entity Prompts**: Per-entity LLM personality instructions via `entityPrompt` field for customized agent behavior
- **Batch Loading**: Optimized Redis operations using JSON.MGET for efficient fixture loading

### Container Architecture

- **Redis**: Latest Redis image with persistence to `./data/redis` volume using RedisJSON and RediSearch
- **Agent Memory Server**: Python 3.12-based container running official Redis AMS with working memory configuration
  - Configured for working memory only (`LONG_TERM_MEMORY=false`)
  - Authentication disabled for local development (`AUTH_MODE=disabled`)
  - Health check endpoint at `/v1/health`
  - Environment-specific configuration via docker-compose overrides
- **Local development**: `docker-compose.yml` orchestrates both services with container networking and shared environment variables
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

### Environment Configuration Strategy

- **Root `.env` file**: Shared configuration for Docker containers (AMS, future services)
- **Azure Functions**: Uses `local.settings.json` for Azure Functions Core Tools compatibility
- **Docker Compose**: Reads from root `.env` with environment-specific overrides

### Azure Functions Local Development

- Copy `functions/ana-api/local.settings.example.json` to `functions/ana-api/local.settings.json`
- Add your OpenAI API key to the copied file
- Azure Functions Core Tools doesn't automatically read `.env` files

### Agent Memory Server Configuration

- **Universal defaults**: Hardcoded in Dockerfile (`LONG_TERM_MEMORY=false`, `PORT=8000`)
- **Environment-specific**: Set via docker-compose.yml (`AUTH_MODE`, `LOG_LEVEL`, `OPENAI_API_KEY`)
- **Development setup**: Copy `.env.example` to `.env` and add your OpenAI API key

### Static Web App Environment Variables

- Build-time only via Vite: `import.meta.env.VITE_*`
- No runtime server-side variables (static files served from CDN)

## Key File Locations

### Package Structure

- **`shared/ana-types/src/`** - All TypeScript types and Zod schemas shared across packages
- **`shared/ana-common/src/`** - Shared utilities, Redis/LLM/AMS clients, admin functions
- **`shared/ana-domain/src/`** - Entity classes and game state management
- **`shared/ana-agents/src/`** - Complete multi-agent LangGraph system
- **`functions/ana-api/src/functions/`** - Azure Functions endpoints that consume all packages

### Multi-Agent System Core

- `shared/ana-agents/src/agent/graph-builder.ts` - Main LangGraph orchestration
- `shared/ana-agents/src/agent/agents/` - All individual agent implementations
- `shared/ana-agents/src/agent/state/` - GameTurnAnnotation and state management
- `functions/ana-api/src/functions/games/take-game-turn.ts` - Main game turn API endpoint

### API Layer

- `api/src/domain/` - Domain objects (SavedGame, GameTurn, GameLog, entities, templates)
- `api/src/services/` - Service layer (game-service, template-service)
- `api/src/clients/` - Redis, LLM, and AMS client configurations
- `api/src/functions/` - Azure Functions HTTP endpoints
- `api/src/utils/` - Logging, JSON utilities, date helpers

### Frontend Architecture

- `web/src/views/` - Feature-based view organization (game/, load-game/, load-template/, game-log/)
- `web/src/services/api.ts` - Centralized API client with type safety
- `web/src/components/` - Reusable UI components with unified dialog system
- `web/src/app/` - App-level state (AppRouter, AppState)

## Key Development Patterns

### Agent Development

- All agents use Zod schemas for structured input/output
- Agents read from dedicated GameTurnAnnotation state channels
- Change-focused behavior: agents recommend specific status and property modifications
- Entity-specific prompts via `entityPrompt` field for customized agent behavior
- Separated concerns: agents recommend changes, arbiter resolves conflicts, committer applies, narrator tells story

### Entity Management

- Private constructor pattern with static factory methods (`GameEntity.load()`, `FixtureEntity.fetchMany()`)
- Template fallback: game-specific entities fall back to template defaults
- Set-based status management with clean array interface
- `save()` method preserves `entityPrompt` while maintaining LLM-safe `toJSON()` separation

### Frontend State Management

- ViewModel pattern with Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Private fields (#) with clean getter/setter interfaces
- Law of Demeter compliance: components only interact with ViewModel public interfaces
- Dual loading states: history loading vs command processing

## Key Technical Constraints

- **ES Modules**: All packages use `"type": "module"` for consistency
- **Azure Functions v4**: Modern programming model with `app.http()` registration
- **Svelte 5**: No SvelteKit - plain Svelte with Vite bundler
- **No global installations**: All tooling installed locally via npm workspaces
- **Node.js v20.x**: Required for Azure Functions v4 compatibility (use `nvm use`)

## Coding Standards

### File Formatting

- **Always end files with a newline**: All source files must end with a newline character
- Consistent with Unix conventions and prevents git diff issues

### JavaScript/TypeScript Style

- **Favor one-line if statements**: When an if statement body is simple, prefer single-line format

  ```typescript
  // Preferred
  if (condition) return value
  if (!isValid) throw new Error('Invalid input')

  // Avoid when simple
  if (condition) {
    return value
  }
  ```

### Git Commit Messages

- **Favor one-line commit messages**: Keep commits concise and focused
- **No attributions or signatures**: Avoid adding "Generated with Claude Code" or co-author attributions to commit messages
- **Imperative mood**: Use imperative present tense (e.g., "Add feature" not "Added feature")

### Dependency Management

- **Always use npm install**: Install packages using `npm install <package>` or `npm install <package> --workspace=<name>`
- **Never edit package.json directly**: Let npm manage the package.json and package-lock.json files
- **Use workspace flag for package-specific dependencies**: `npm install redis --workspace=@ana/common`
