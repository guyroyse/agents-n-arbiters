# Agents & Arbiters

A multi-agent text adventure game built for Azure with [Redis](https://redis.io/), [LangGraph.js](https://langchain-ai.github.io/langgraphjs/), and [Agent Memory Server](https://redis.github.io/agent-memory-server/).

## Overview

In this game, multiple AI agents (location, items, NPCs) independently react to player input. Each agent contributes specialized knowledge—locations provide environmental context, items offer interaction possibilities, NPCs deliver character-driven responses—while an arbiter synthesizes all agent responses into a single, coherent game experience. This collaborative approach creates richer, more dynamic storytelling than single-agent systems.

While this example is for a game, multi-agent collaboration (MAC) has powerful applications beyond gaming. For example, a customer support chatbot could use specialized agents to handle different aspects of a customer request—one agent analyzes technical issues, another handles billing questions, and a third manages escalations—with an arbiter providing unified responses to customers.

You can read more about multi-agent collaboration in the [LangGraph documentation](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/multi-agent-collaboration/).

## Prerequisites

- [Node.js v20.x](https://nodejs.org/) (run `nvm use` if you have nvm installed)
- [Docker](https://www.docker.com/)

## Getting Started

1. **Start services:**

   ```bash
   docker compose up
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Copy local settings**:

   ```bash
   cp packages/ana-api/local.settings.example.json packages/ana-api/local.settings.json
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Development URLs

- **Frontend:** http://localhost:4280 (Static Web App CLI)
- **API:** http://localhost:7071/api/\* (Azure Functions)
- **Redis:** localhost:6379
- **Agent Memory Server:** http://localhost:8000 (placeholder)

## Project Structure

- **`packages/ana-web/`** - Svelte 5 frontend with terminal-style interface and Tailwind CSS
- **`packages/ana-api/`** - Azure Functions v4 API backend
- **`packages/agent-memory-server/`** - Redis-based containerized memory server for AI agents
- **`packages/shared/`** - Shared TypeScript types
- **`data/redis/`** - Persistent Redis data (gitignored runtime, committed seed data)
- **`infrastructure/`** - Infrastructure as Code (Bicep templates)
