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

### ✅ Working Systems

- **Multi-agent game engine**: Complete LangGraph.js workflow with classifier → agents → arbiter → committer flow
- **Game interfaces**: Web frontend (port 4280), admin dashboard (port 4281), API backend (port 7071)
- **Persistent state**: Redis-backed entities with game save/load, template management, and structured logging
- **Agent types**: Location, fixture, player, and arbiter agents with entity-specific prompts and conservative behavior
- **Game world**: "The Shrine of Forgotten Whispers" with atmospheric descriptions and interactive fixtures
- **State management**: Multi-channel GameTurnAnnotation system with Set-based status management and entity persistence

### 🚧 Next Priorities

- Add NPC agent types and implementations
- Deploy to Azure with AMR and Azure Container Apps

## Development Commands

### Initial Setup

```bash
docker compose up                                                        # Start Redis + Agent Memory Server containers
npm install                                                              # Install all workspace dependencies
cp packages/ana-api/local.settings.example.json packages/ana-api/local.settings.json  # Copy Azure Functions local settings
```

### Full-stack Development

```bash
npm run dev           # Build all packages, then start all services in parallel (web:4280, admin:4281, api:7071)
```

### Individual Package Development

```bash
npm run dev --workspace=@ana/web      # SWA CLI with Functions integration (port 4280)
npm run dev --workspace=@ana/admin    # Admin interface SWA CLI (port 4281)
npm run dev --workspace=@ana/api      # Azure Functions Core Tools (port 7071)
```

### Build Commands

```bash
npm run build                         # Build all packages in dependency order (shared first, then others in parallel)
npm run build --workspace=@ana/shared # TypeScript compilation for shared types
npm run build --workspace=@ana/web    # Vite production build
npm run build --workspace=@ana/admin  # Vite production build for admin interface
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

### Multi-Agent System Architecture (@ana/api)

The core innovation is the multi-agent collaboration system built with LangGraph.js:

- **Game Turn Flow**: `/api/take-turn` endpoint orchestrates the complete multi-agent workflow
- **LangGraph Implementation**: `MultiAgentGraph` class in `services/agent/graph-builder.ts` constructs dynamic execution graphs
- **Agent Types**:
  - `classifier` - LLM-powered routing to determine which agents should respond
  - `location-agent` - Provides environmental context and atmosphere
  - `fixture-agent` - Handles item interactions and world object responses
  - `player-agent` - Manages player introspection, inventory, status, abilities
  - `arbiter` - Synthesizes all agent responses into coherent narrative
  - `committer` - Applies entity state changes and persists to Redis

### Multi-Channel State Management

- **GameTurnAnnotation**: Custom LangGraph annotation replacing MessagesAnnotation for clean context engineering
- **Dedicated State Channels**: Each agent reads from specific state channels (classifier_reasoning, entities, player_input, etc.)
- **Domain Entities**: Redis-backed `GameEntity`, `LocationEntity`, `FixtureEntity`, `PlayerEntity` with template fallback patterns
- **State Change System**: Set-based status management with entity persistence and LLM-safe JSON serialization

### Entity and Prompt System

- **Entity Hierarchy**: Base `GameEntity` class with specialized subclasses for different game object types
- **Template Management**: Admin interface for loading world templates into Redis (`template:entity:*` keyspace)
- **Entity Prompts**: Per-entity LLM personality instructions via `entityPrompt` field for customized agent behavior
- **Batch Loading**: Optimized Redis operations using JSON.MGET for efficient fixture loading

### Container Architecture

- **Redis**: Latest Redis image with persistence to `./data/redis` volume using RedisJSON and RediSearch
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

## Key File Locations

### Multi-Agent System Core
- `packages/ana-api/src/lib/services/agent/graph-builder.ts` - Main LangGraph orchestration
- `packages/ana-api/src/lib/services/agent/agents/` - All individual agent implementations
- `packages/ana-api/src/lib/domain/` - Entity classes and game state management
- `packages/ana-api/src/functions/take-turn.ts` - Main game turn API endpoint

### Frontend Architecture
- `packages/ana-web/src/views/` - Feature-based view organization (game/, load-game/, etc.)
- `packages/ana-web/src/services/api.ts` - Centralized API client with type safety
- `packages/ana-web/src/components/` - Reusable UI components with unified dialog system

### Admin Interface
- `packages/ana-admin/` - Complete admin dashboard for log viewing and template management
- Template loading functionality for world initialization

### Shared Types
- `packages/shared/src/` - All TypeScript types and Zod schemas shared across packages

## Key Development Patterns

### Agent Development
- All agents use Zod schemas for structured input/output
- Agents read from dedicated GameTurnAnnotation state channels
- Conservative behavior: avoid unnecessary status changes on informational commands
- Entity-specific prompts via `entityPrompt` field for personalized LLM behavior

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
