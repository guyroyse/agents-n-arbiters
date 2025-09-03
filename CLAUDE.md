# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript monorepo for an Azure JAMstack application using npm workspaces. The architecture consists of:

- **`packages/web-app/`** - Svelte 5 frontend with Tailwind CSS v4, served via Azure Static Web Apps
- **`packages/functions/`** - Azure Functions v4 serverless API backend 
- **`packages/shared/`** - Common TypeScript types and utilities (placeholder)
- **`packages/agent-memory-server/`** - Redis-based Agent Memory Server integration (placeholder)

The project targets agent/AI tooling with Redis integration and LangGraph.js support planned.

## Development Commands

### Full-stack Development
```bash
npm run dev           # Build all packages, then start SWA + Functions in parallel
```

### Individual Package Development  
```bash
npm run dev --workspace=web-app      # Vite dev server with hot reload
npm run dev --workspace=functions    # Azure Functions Core Tools
```

### Build Commands
```bash
npm run build         # Build all packages in parallel
npm run build --workspace=web-app    # Vite production build
npm run build --workspace=functions  # TypeScript compilation to dist/
```

### Type Checking
```bash
npm run check --workspace=web-app    # Svelte + TypeScript checking
```

## Architecture Details

### Monorepo Structure
- **Root level tooling**: Azure SWA CLI, Azure Functions Core Tools, npm-run-all orchestration
- **Package isolation**: Each package has independent dependencies and build processes
- **Workspace scripts**: Root orchestrates via `npm-run-all --parallel/--sequential`

### TypeScript Configuration Strategy
Both packages share aligned linting standards but different compilation targets:
- **web-app**: Bundler mode (`moduleResolution: "bundler"`) with Vite, no emit
- **functions**: Node.js mode (`moduleResolution: "node"`) with compilation to `dist/`
- **Shared settings**: ES2022 target, strict linting, isolated modules, verbatim module syntax

### Azure Static Web Apps Integration
- **Local development**: SWA CLI proxies `/api/*` requests to Azure Functions on port 7071
- **Production routing**: Configured via `staticwebapp.config.json` with asset exclusions
- **API access**: Functions available at `/api/version` through SWA, direct access via Functions host

### Styling System
- **Tailwind CSS v4** with custom Redis-themed color palette
- **Custom fonts**: Space Grotesk (sans) and Space Mono (mono) via Google Fonts
- **CSS variables**: Extensive Redis brand colors (redis-midnight, redis-hyper, etc.)

## Environment Configuration

### Azure Functions Local Development
- Copy `packages/functions/local.settings.example.json` to `packages/functions/local.settings.json`
- Required Node.js: v18.x or v20.x (Azure Functions v4 compatibility)
- Environment variables accessible via `process.env.NODE_ENV`

### Static Web App Environment Variables
- Build-time only via Vite: `import.meta.env.VITE_*`
- No runtime server-side variables (static files served from CDN)

## Key Technical Constraints

- **ES Modules**: All packages use `"type": "module"` for consistency
- **Azure Functions v4**: Modern programming model with `app.http()` registration
- **Svelte 5**: No SvelteKit - plain Svelte with Vite bundler
- **No global installations**: All tooling installed locally via npm workspaces