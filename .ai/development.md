# Development Guide

## Prerequisites

- Node.js v20.x (run `nvm use` to switch to correct version)
- Docker (for Redis, LiteLLM, Agent Memory Server)
- OpenAI API key

## Initial Setup

```bash
# 1. Copy environment files
cp .env.example .env
cp api/local.settings.example.json api/local.settings.json

# 2. Add your OpenAI API key to both files

# 3. Start Docker services
docker compose up

# 4. Install dependencies
npm install
```

## Development Commands

### Full-stack Development
```bash
npm run dev           # Build all packages, then start web (4280) + api (7071)
```

### Individual Workspaces
```bash
npm run dev --workspace=@ana/web      # SWA CLI with Functions integration (port 4280)
npm run dev --workspace=@ana/api      # Azure Functions Core Tools (port 7071)
```

### Build Commands
```bash
npm run build                         # Build all packages (types first, then web/api in parallel)
npm run build --workspace=@ana/types  # TypeScript compilation for shared types
npm run build --workspace=@ana/web    # Vite production build
npm run build --workspace=@ana/api    # TypeScript compilation to dist/ with tsc-alias
```

## Development URLs

- **Frontend:** http://localhost:4280 (Static Web App CLI)
- **API:** http://localhost:7071/api/* (Azure Functions)
- **Agent Memory Server:** http://localhost:8000 (Redis AMS)
- **Redis:** localhost:6379

## Environment Configuration

### Root `.env` File
Shared configuration for Docker containers (Redis, LiteLLM, AMS):
```bash
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
```

### Azure Functions `local.settings.json`
Azure Functions Core Tools doesn't read `.env` files, so it needs its own config:
```json
{
  "Values": {
    "OPENAI_API_KEY": "sk-...",
    "OPENAI_BASE_URL": "http://localhost:4000",
    "REDIS_URL": "redis://localhost:6379",
    "AMS_BASE_URL": "http://localhost:8000"
  }
}
```

## Coding Standards

### File Formatting
- **Always end files with a newline** - Unix convention, prevents git diff issues

### JavaScript/TypeScript Style
- **Favor one-line if statements** when body is simple:
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
- **Favor one-line commit messages** - Keep commits concise and focused
- **No attributions or signatures** - Avoid "Generated with Claude Code" etc.
- **Imperative mood** - "Add feature" not "Added feature"

### Dependency Management
- **Always use npm install** - Never edit package.json directly
- **Use workspace flag** for package-specific dependencies:
  ```bash
  npm install redis --workspace=@ana/api
  npm install svelte --workspace=@ana/web
  ```

## Key Technical Constraints

- **ES Modules** - All packages use `"type": "module"`
- **Azure Functions v4** - Modern programming model with `app.http()` registration
- **Svelte 5** - No SvelteKit, plain Svelte with Vite bundler
- **No global installations** - All tooling installed locally via npm workspaces
- **Node.js v20.x** - Required for Azure Functions v4 compatibility

## TypeScript Configuration

- **@ana/web** - Bundler mode (`moduleResolution: "bundler"`) with Vite, no emit
- **@ana/api** - Node.js mode (`moduleResolution: "node"`) with compilation to `dist/`
- **Shared settings** - ES2022 target, strict linting, isolated modules

## Docker Services

### Redis
- Latest Redis image with RedisJSON and RediSearch modules
- Persistence to `./redis` volume
- Port 6379

### LiteLLM
- OpenAI-compatible proxy for Azure OpenAI
- Port 4000
- Configuration in `litellm.config.yaml`

### Agent Memory Server
- Redis-backed working memory for narrator agent
- Port 8000
- Working memory only (`LONG_TERM_MEMORY=false`)
- Auth disabled for local dev (`AUTH_MODE=disabled`)

