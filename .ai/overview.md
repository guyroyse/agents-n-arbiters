# Agents & Arbiters - Project Overview

## What This Is

A multi-agent text adventure game built as a TypeScript monorepo. Multiple AI agents (location, fixtures, player, exits) independently react to player input, with an arbiter synthesizing their responses into a coherent game experience. Redis stores all game state for persistence.

## Current Architecture

```
types/     - Shared TypeScript types and Zod schemas
api/       - Azure Functions v4 API with domain objects, services, and clients
web/       - Svelte 5 frontend with game play, log viewing, and template loading
templates/ - World template JSON files for game initialization
infra/     - Bicep templates for Azure deployment
```

## What Works ✅

### Multi-Agent Game Engine
- Complete LangGraph.js workflow: classifier → agents → arbiter → committer → narrator
- Agent types: location, fixture, player, exit agents with entity-specific prompts
- Change-focused behavior: agents recommend changes, arbiter resolves conflicts, committer applies
- Dedicated narrator agent for post-committer storytelling with narrative continuity

### Game State & Persistence
- Redis-backed entities with RedisJSON and RediSearch
- Game save/load system with SavedGame domain objects
- Template management system for world initialization
- Structured logging to Redis Streams (game-specific logs)
- Movement system with exit agents handling location transitions

### Frontend (Web App)
- Terminal-style game interface with command input
- Game history view with turn-by-turn playback
- Load/save game functionality
- Game log viewer with specialized renderers (JSON, Mermaid, String)
- Template loader with file picker for world initialization
- Svelte 5 with runes-based state management

### Infrastructure
- Docker Compose for local development (Redis, LiteLLM, Agent Memory Server)
- Azure Functions v4 with modern programming model
- Agent Memory Server integration for narrator conversation history
- LiteLLM proxy for OpenAI-compatible API

## What's Next 🚧

### Immediate Priorities
- Deploy to Azure (next task!)
- Add item entities and item agent types
- Add NPC agent types and implementations

### Future Enhancements
- More world templates (currently have: dungeon-crawl, neon-streets, starship-odyssey, pirates-cove)
- Enhanced narrative generation
- More complex agent interactions

