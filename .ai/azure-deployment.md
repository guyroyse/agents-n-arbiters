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
- Static Web App → Azure Functions (linked backend)

## Prerequisites

- Azure CLI (`az`) installed and authenticated
- Azure Developer CLI (`azd`) installed
- Azure subscription with permissions to create resources

## Deployment Steps

### 1. Initialize Azure Developer CLI

```bash
# Login to Azure
azd auth login

# Initialize the project (if not already done)
azd init
```

### 2. Deploy to Azure

The infrastructure is fully defined in Bicep files and ready to deploy:

```bash
# Provision and deploy all resources
azd up

# Follow prompts to:
# - Select Azure subscription
# - Select region (e.g., eastus, westus2)
# - Choose environment name (stage or prod)
```

This single command will:

1. Create all Azure resources (Redis, OpenAI, Container Apps, Functions, Static Web App)
2. Build the API and web projects
3. Deploy the API to Azure Functions
4. Deploy the web app to Static Web App
5. Configure all environment variables automatically

### 3. Verify Deployment

```bash
# Get deployment URLs and configuration
azd show

# View environment variables
azd env get-values

# Test API endpoint
curl https://<function-app-url>/api/version

# Open web app in browser
azd browse web
```

### 4. View Logs and Monitor

```bash
# Stream Function App logs
azd monitor --logs

# Open Application Insights in Azure Portal
azd monitor
```

## Infrastructure Details

### Bicep Modules

All infrastructure is defined in modular Bicep files in `infra/`:

- **`main.bicep`** - Orchestrates all resources with proper dependencies
- **`monitoring.bicep`** - Application Insights and Log Analytics workspace
- **`identities.bicep`** - User-assigned managed identity for Azure Functions
- **`containers.bicep`** - Container Apps Environment for hosting LiteLLM and AMS
- **`openai.bicep`** - Azure OpenAI Service with model deployments (gpt-4o, gpt-4o-mini, text-embedding-3-small)
- **`redis.bicep`** - Azure Managed Redis Enterprise with RedisJSON and RediSearch modules
- **`litellm.bicep`** - LiteLLM Container App (OpenAI-compatible proxy for Azure OpenAI)
- **`ams.bicep`** - Agent Memory Server Container App
- **`functions.bicep`** - Azure Functions App with all required environment variables
- **`web.bicep`** - Static Web App for frontend
- **`litellm.config.yaml`** - LiteLLM configuration for model routing

### Environment Variables

All environment variables are automatically configured by the Bicep templates:

**Azure Functions:**

- `OPENAI_BASE_URL` - LiteLLM Container App URL
- `OPENAI_API_KEY` - LiteLLM master key (auto-generated)
- `REDIS_URL` - Azure Managed Redis connection string
- `AMS_BASE_URL` - AMS Container App URL
- `AMS_CONTEXT_WINDOW_MAX` - Context window size (default: 4000)
- `APPLICATIONINSIGHTS_CONNECTION_STRING` - Application Insights connection

**LiteLLM Container App:**

- `LITELLM_MASTER_KEY` - Auto-generated secure key
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API key
- `GPT4O_DEPLOYMENT_NAME` - Azure deployment name for gpt-4o
- `GPT4O_MINI_DEPLOYMENT_NAME` - Azure deployment name for gpt-4o-mini
- `EMBEDDING_DEPLOYMENT_NAME` - Azure deployment name for embeddings

**AMS Container App:**

- `REDIS_URL` - Azure Managed Redis connection string
- `OPENAI_API_KEY` - LiteLLM master key
- `OPENAI_API_BASE` - LiteLLM Container App URL
- `AUTH_MODE` - OAuth2 authentication
- `OAUTH2_ISSUER_URL` - Azure AD issuer URL
- `OAUTH2_AUDIENCE` - AMS application ID

### Resource Naming

All resources use a unique token generated from the resource group, environment name, and location:

```
resourceToken = toLower(uniqueString(resourceGroup().id, environmentName, location))
```

Example resource names:

- `openai-abc123def456` - Azure OpenAI Service
- `redis-abc123def456` - Azure Managed Redis
- `litellm-abc123def456` - LiteLLM Container App
- `ams-abc123def456` - AMS Container App
- `func-abc123def456` - Azure Functions App
- `swa-abc123def456` - Static Web App

## Teardown

```bash
# Delete all Azure resources
azd down --purge
```

## Key Differences from Local Development

1. **LiteLLM** - Points to Azure OpenAI instead of OpenAI API
2. **Redis** - Azure Managed Redis Enterprise instead of Docker container
3. **AMS** - Container App instead of Docker container
4. **Authentication** - OAuth2 authentication for AMS (vs disabled in local)
5. **Monitoring** - Application Insights for logging and telemetry
6. **Managed Identities** - Secure service-to-service communication

## Cost Considerations

- **Azure Managed Redis Enterprise** - Most expensive component (~$500-1000/month for Balanced_B1)
- **Azure OpenAI** - Pay per token usage
- **Container Apps** - Pay for CPU/memory allocation (~$50-100/month for 2 apps)
- **Azure Functions** - Consumption plan (pay per execution, very low cost)
- **Static Web App** - Standard tier (~$9/month)
- **Application Insights** - Pay per GB ingested (usually <$10/month for small apps)

**Total estimated cost:** ~$600-1200/month for production workload

Consider using Azure Redis Cache (Basic/Standard) instead of Enterprise for development/testing to reduce costs significantly (~$15-50/month).
