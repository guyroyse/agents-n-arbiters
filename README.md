# Agents & Arbiters

A multi-agent text adventure game built for Azure with [Redis](https://redis.io/), [LangGraph.js](https://langchain-ai.github.io/langgraphjs/), and [Agent Memory Server](https://redis.github.io/agent-memory-server/).

## Overview

In this game, multiple AI agents (location, items, NPCs) independently react to player input. Each agent contributes specialized knowledge—locations provide environmental context, items offer interaction possibilities, NPCs deliver character-driven responses—while an arbiter synthesizes all agent responses into a single, coherent game experience. This collaborative approach creates richer, more dynamic storytelling than single-agent systems.

While this example is for a game, multi-agent collaboration (MAC) has powerful applications beyond gaming. For example, a customer support chatbot could use specialized agents to handle different aspects of a customer request—one agent analyzes technical issues, another handles billing questions, and a third manages escalations—with an arbiter providing unified responses to customers.

You can read more about multi-agent collaboration in the [LangGraph documentation](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/multi-agent-collaboration/).

## Prerequisites

- [Node.js v20.x](https://nodejs.org/) (run `nvm use` if you have nvm installed)
- [Docker](https://www.docker.com/)
- [OpenAI API key](https://platform.openai.com/api-keys) (required for AI functionality)

## Getting Started

1. **Copy configuration files:**

```bash
cp .env.example .env
cp api/local.settings.example.json api/local.settings.json
```

Then edit both `.env` and `local.settings.json` to add your OpenAI API key.

2. **Start services**

```bash
 docker compose up
```

3. **Install dependencies and start development:**

```bash
npm install
npm run dev
```

## Development URLs

- **Frontend:** http://localhost:4280 (Static Web App CLI)
- **API:** http://localhost:7071/api/\* (Azure Functions)
- **Agent Memory Server:** http://localhost:8000 (Redis AMS)
- **Redis:** localhost:6379

## Project Structure

This is a TypeScript monorepo built with npm workspaces:

### Core Packages

- **`shared/ana-types/`** (@ana/types) - Pure TypeScript types and Zod schemas
- **`shared/ana-common/`** (@ana/common) - Shared utilities, Redis/LLM clients, admin functions
- **`shared/ana-domain/`** (@ana/domain) - Entity classes and game state management
- **`shared/ana-agents/`** (@ana/agents) - Complete multi-agent LangGraph system

### Applications

- **`static-web-apps/ana-web/`** (@ana/web) - Svelte 5 frontend with terminal-style game interface
- **`functions/ana-api/`** (@ana/api) - Azure Functions v4 API endpoints

### Infrastructure

- **`containers/agent-memory-server/`** - Containerized Agent Memory Server (working memory)
- **`data/redis/`** - Persistent Redis data storage for local development
- **`infrastructure/`** - Infrastructure as Code (Bicep templates for Azure deployment)
