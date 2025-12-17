# Azure Migration Plan for Agents & Arbiters

Based on analysis of the `podbot-azure` reference implementation, here are the changes needed to deploy Agents & Arbiters to Azure.

## Key Architectural Changes

### 1. **LiteLLM Integration** (Critical)

**Why**: Azure OpenAI uses different API patterns than OpenAI. LiteLLM provides an OpenAI-compatible proxy.

**Changes Needed**:

- Add `litellm.config.yaml` at root (similar to podbot)
- Update `docker-compose.yml` to include LiteLLM service
- Create `infra/litellm.bicep` for Azure Container App deployment
- Update all LLM client code to use LiteLLM endpoint instead of direct OpenAI

### 2. **Infrastructure as Code** (Complete Rewrite)

**Current State**: Basic Bicep files in `/infra`
**Target State**: Modular Bicep architecture like podbot

**New Bicep Modules Needed**:

- `main.bicep` - Orchestrates all resources with proper dependencies
- `ams.bicep` - Agent Memory Server as Azure Container App
- `litellm.bicep` - LiteLLM proxy as Azure Container App
- `containers.bicep` - Container Apps Environment
- `redis.bicep` - Azure Managed Redis (Enterprise tier for RedisJSON/RediSearch)
- `openai.bicep` - Azure OpenAI Service with model deployments
- `functions.bicep` - Azure Functions (already exists, needs updates)
- `web.bicep` - Static Web App (already exists, needs updates)
- `monitoring.bicep` - Application Insights
- `identities.bicep` - Managed identities for secure access

### 3. **Azure Developer CLI (azd) Support**

**Add**: `azure.yaml` at root for azd deployment workflow

**Structure**:

```yaml
name: agents-n-arbiters
infra:
  provider: bicep
  path: infra
  module: main
hooks:
  predeploy:
    posix:
      shell: sh
      run: npm install && npm run build
services:
  api:
    project: ./api
    dist: .
    language: ts
    host: function
  web:
    project: ./web
    dist: dist
    language: ts
    host: staticwebapp
```

### 4. **Package Structure Changes**

**Current**: Monorepo with types/api/web
**Target**: Simplified for Azure deployment

**Changes**:

- Root `package.json` has `api`, `web`, `types` workspaces
- Build scripts updated to remove admin references
- Types workspace is shared between api and web

### 5. **Environment Configuration**

**Local Development** (docker-compose.yml):

- Redis (local)
- LiteLLM (pointing to OpenAI)
- Agent Memory Server (pointing to local Redis + LiteLLM)

**Azure Production**:

- Azure Managed Redis (Enterprise tier)
- LiteLLM Container App (pointing to Azure OpenAI)
- AMS Container App (pointing to Azure Redis + LiteLLM)
- Azure Functions (pointing to LiteLLM + AMS)
- Static Web App (web frontend with game play, logs, and template loading)

### 6. **LLM Client Updates**

**Current**: Direct OpenAI SDK calls
**Target**: LiteLLM-compatible calls

**Changes in `api/src/clients/llm-client.ts`**:

- Keep using OpenAI SDK (LiteLLM is OpenAI-compatible)
- Change base URL to LiteLLM endpoint
- Use LiteLLM master key instead of OpenAI API key
- Model names change from `gpt-4o` to deployment names

### 7. **AMS Client Updates**

**Current**: Direct HTTP calls to local AMS
**Target**: OAuth2-authenticated calls to Azure Container App

**Changes in `api/src/clients/ams-client.ts`**:

- Add Azure AD authentication for production
- Keep unauthenticated for local development
- Use managed identity tokens in Azure

### 8. **Redis Client Updates**

**Current**: Local Redis connection
**Target**: Azure Managed Redis with Entra ID auth

**Changes in `api/src/clients/redis-client.ts`**:

- Add support for Azure Managed Redis connection strings
- Add Entra ID authentication for production
- Keep simple connection for local development

## File-by-File Changes

### New Files to Create

1. `azure.yaml` - Azure Developer CLI configuration
2. `litellm.config.yaml` - LiteLLM model mappings
3. `infra/main.bicep` - Main orchestration
4. `infra/ams.bicep` - AMS Container App
5. `infra/litellm.bicep` - LiteLLM Container App
6. `infra/containers.bicep` - Container Apps Environment
7. `infra/redis.bicep` - Azure Managed Redis
8. `infra/openai.bicep` - Azure OpenAI Service
9. `infra/monitoring.bicep` - Application Insights
10. `infra/identities.bicep` - Managed Identities

### Files to Update

1. `docker-compose.yml` - Add LiteLLM service
2. `package.json` - Update workspace list, remove types
3. `api/src/clients/llm-client.ts` - LiteLLM integration
4. `api/src/clients/ams-client.ts` - Azure auth support
5. `api/src/clients/redis-client.ts` - Azure Redis support
6. `infra/functions.bicep` - Update for new dependencies
7. `infra/web.bicep` - Update for Static Web App linking

### Files to Delete

None - existing infra files will be replaced/updated

## Deployment Workflow

### Local Development

```bash
docker compose up          # Start Redis, LiteLLM, AMS
npm run dev               # Start API + Web
```

### Azure Deployment

```bash
azd auth login
azd up                    # Provision + deploy everything
```

### Azure Teardown

```bash
azd down --purge          # Delete all resources
```

## Next Steps

1. Create `azure.yaml` and `litellm.config.yaml`
2. Build out Bicep infrastructure modules
3. Update LLM/AMS/Redis clients for Azure
4. Test local development with LiteLLM
5. Deploy to Azure and validate

## Key Differences from Podbot

1. **Single Static Web App**: ANA has one web app with game play, logs, and template loading
2. **No User Authentication**: ANA doesn't need OAuth2 for users (game-based, not user-based)
3. **Game State Persistence**: ANA stores game templates and saves in Redis
4. **Multi-Agent System**: ANA has complex LangGraph workflows, podbot is simpler chat

## Estimated Effort

- **Bicep Infrastructure**: 4-6 hours
- **LiteLLM Integration**: 2-3 hours
- **Client Updates**: 2-3 hours
- **Testing & Debugging**: 3-4 hours
- **Total**: ~12-16 hours
