# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agents & Arbiters** is a multi-agent text adventure game built as a TypeScript monorepo using npm workspaces. The concept uses multiple AI agents (location, items, NPCs) to react to player input, with an arbiter synthesizing responses into a coherent game experience. Redis will store game state for persistence.

Current architecture:

- **`packages/ana-web/`** (@ana/web) - Svelte 5 frontend with terminal-style game interface
- **`packages/ana-api/`** (@ana/api) - Azure Functions v4 API with game loop endpoints
- **`packages/shared/`** - Shared TypeScript types and interfaces
- **`packages/agent-memory-server/`** - Redis-based Agent Memory Server integration (planned)

## Current Implementation Status

### ✅ Completed
- **Basic game loop**: Terminal UI with command input and history display
- **API endpoints**: `/api/version` and `/api/take-turn` (currently echoes input)
- **Component architecture**: Modular Svelte 5 components with proper semantic HTML
- **Data access layer**: Centralized API functions in `@lib/api`
- **Game state management**: History loading with mock data simulation
- **UI/UX features**: Auto-scrolling history, focus management, loading states

### 🚧 Next Steps
- Replace echo functionality with actual AI agent integration
- Implement game state persistence with Redis
- Add session management (create/load saved games)
- Build multi-agent system with LangGraph.js

## Development Commands

### Full-stack Development
```bash
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