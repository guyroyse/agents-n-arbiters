# Azure Deployment Guide

## Architecture Overview

### Local Development Stack
- Redis (Docker)
- LiteLLM (Docker) → OpenAI API
- Agent Memory Server (Docker) → Redis + LiteLLM
- Azure Functions → LiteLLM + AMS + Redis
- Static Web App → Azure Functions

### Azure Production Stack
- Azure Managed Redis (Enterprise tier with RedisJSON/RediSearch)
- LiteLLM Container App → Azure OpenAI
- AMS Container App → Azure Redis + LiteLLM
- Azure Functions → LiteLLM + AMS + Azure Redis
- Static Web App → Azure Functions

## Prerequisites

- Azure CLI (`az`) installed and authenticated
- Azure Developer CLI (`azd`) installed
- Azure subscription with permissions to create resources
- OpenAI API key (or Azure OpenAI service)

## Deployment Steps

### 1. Create Azure Resources Configuration

Create `azure.yaml` at project root:

```yaml
name: agents-n-arbiters
infra:
  provider: bicep
  path: infra
  module: main
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

### 2. Update Bicep Infrastructure

Required Bicep modules in `infra/`:

- **`main.bicep`** - Orchestrates all resources
- **`redis.bicep`** - Azure Managed Redis (Enterprise tier)
- **`openai.bicep`** - Azure OpenAI Service with model deployments
- **`containers.bicep`** - Container Apps Environment
- **`litellm.bicep`** - LiteLLM as Container App
- **`ams.bicep`** - Agent Memory Server as Container App
- **`functions.bicep`** - Azure Functions (update existing)
- **`static-web-app-web.bicep`** - Static Web App (update existing)
- **`monitoring.bicep`** - Application Insights
- **`identities.bicep`** - Managed identities for secure access

### 3. LiteLLM Configuration

Ensure `litellm.config.yaml` exists at project root with Azure OpenAI configuration:

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: azure/gpt-4o
      api_base: ${AZURE_OPENAI_ENDPOINT}
      api_key: ${AZURE_OPENAI_KEY}
      api_version: "2024-02-15-preview"
```

### 4. Deploy to Azure

```bash
# Login to Azure
azd auth login

# Provision and deploy all resources
azd up

# Follow prompts to select subscription and region
```

### 5. Configure Environment Variables

After deployment, set required environment variables in Azure:

**Azure Functions App Settings:**
- `OPENAI_BASE_URL` - LiteLLM Container App URL
- `REDIS_URL` - Azure Managed Redis connection string
- `AMS_BASE_URL` - AMS Container App URL

**LiteLLM Container App:**
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_KEY`

**AMS Container App:**
- `REDIS_URL` - Azure Managed Redis connection string
- `OPENAI_BASE_URL` - LiteLLM Container App URL
- `LONG_TERM_MEMORY` - `false`
- `AUTH_MODE` - `disabled` (or configure auth)

### 6. Verify Deployment

```bash
# Get deployment URLs
azd show

# Test API endpoint
curl https://<function-app-url>/api/version

# Open web app
open https://<static-web-app-url>
```

## Teardown

```bash
# Delete all Azure resources
azd down --purge
```

## Key Differences from Local Development

1. **LiteLLM** - Points to Azure OpenAI instead of OpenAI API
2. **Redis** - Azure Managed Redis instead of Docker container
3. **AMS** - Container App instead of Docker container
4. **Authentication** - Managed identities for secure service-to-service communication
5. **Monitoring** - Application Insights for logging and telemetry

## Cost Considerations

- **Azure Managed Redis Enterprise** - Most expensive component (~$500-1000/month)
- **Azure OpenAI** - Pay per token usage
- **Container Apps** - Pay for CPU/memory allocation
- **Azure Functions** - Consumption plan (pay per execution)
- **Static Web App** - Free tier available

Consider using Azure Redis Cache (Basic/Standard) instead of Enterprise for development/testing to reduce costs.

