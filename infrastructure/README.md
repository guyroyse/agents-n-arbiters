# Agents & Arbiters - Azure Infrastructure

This directory contains Bicep templates for deploying Agents & Arbiters to Azure.

## Architecture

- **Azure Managed Redis** - Game state storage with RedisJSON & RediSearch
- **Azure OpenAI** - GPT-4o, GPT-4o-mini, and text-embedding-3-small models
- **Azure Container Apps** - Agent Memory Server for conversation history
- **Azure Functions** - Backend API endpoints for game logic
- **Azure Static Web Apps** - Two frontends (game and admin) with API proxy
- **Azure AD App Registration** - OAuth2 authentication for AMS

## Prerequisites

1. **Azure CLI** installed and authenticated
2. **Bicep** CLI (comes with Azure CLI)
3. **Azure subscription** with appropriate permissions
4. **Node.js v20.x** (for local development)
5. **Bash shell** (Mac/Linux native, Windows users use WSL or Git Bash)

## Deployment Steps

### 1. Create App Registration

Before deploying, create an Azure AD App Registration for AMS OAuth2:

```bash
./scripts/create-app-registration.sh agents-arbiters-ams
```

Note the `App ID` and `Tenant ID` from the output.

### 2. Create Resource Group

```bash
az group create \
  --name agents-arbiters-rg \
  --location eastus
```

### 3. Deploy Infrastructure

```bash
az deployment group create \
  --resource-group agents-arbiters-rg \
  --template-file main.bicep \
  --parameters appName=agents-arbiters \
               amsAppId=<app-id-from-step-1> \
               amsTenantId=<tenant-id-from-step-1>
```

### 4. Note the Outputs

After deployment completes, save these outputs:

```bash
az deployment group show \
  --resource-group agents-arbiters-rg \
  --name main \
  --query properties.outputs
```

Key outputs include:
- `webAppUrl` - Game frontend URL (player-facing interface)
- `adminAppUrl` - Admin dashboard URL (log viewing and template management)
- `functionAppUrl` - Backend API URL
- `amsUrl` - Agent Memory Server URL
- `redisHostname` and `redisPort` - Redis connection details
- `openAiEndpoint` - Azure OpenAI endpoint

### 5. Deploy Application Code

The Bicep templates create the infrastructure, but you still need to deploy your application code:

#### Deploy Azure Functions

```bash
cd functions/ana-api
npm run build
func azure functionapp publish agents-arbiters-api
```

#### Deploy Static Web Apps

Both SWAs need their deployment tokens from the Bicep outputs:

```bash
# Get deployment tokens
WEB_TOKEN=$(az staticwebapp secrets list \
  --name agents-arbiters-web \
  --query properties.apiKey -o tsv)

ADMIN_TOKEN=$(az staticwebapp secrets list \
  --name agents-arbiters-admin \
  --query properties.apiKey -o tsv)

# Deploy game frontend
cd static-web-apps/ana-web
npm run build
npx @azure/static-web-apps-cli deploy \
  --deployment-token $WEB_TOKEN \
  --app-location . \
  --output-location dist

# Deploy admin dashboard
cd ../ana-admin
npm run build
npx @azure/static-web-apps-cli deploy \
  --deployment-token $ADMIN_TOKEN \
  --app-location . \
  --output-location dist
```

## Environment Configuration

### For Azure Functions (Production)

These are automatically configured by Bicep during deployment:

```bash
NODE_ENV=production
REDIS_URL=<redisHostname>:<redisPort>
AMS_BASE_URL=<amsUrl>
AMS_SCOPE=api://<amsAppId>/.default
OPENAI_ENDPOINT=<openAiEndpoint>
OPENAI_DEPLOYMENT=<gpt4oMiniDeploymentName>
OPENAI_API_KEY=<retrieved-via-bicep>
AMS_CONTEXT_WINDOW_MAX=4000
```

The Function App also uses a **managed identity** to authenticate with:
- Azure OpenAI (via Entra ID)
- Azure Managed Redis (via Entra ID)
- Agent Memory Server (via OAuth2 with AMS scope)

### For Local Development

Your existing `.env` and `local.settings.json` continue to work:

```bash
NODE_ENV=development
REDIS_URL=redis://localhost:6379
AMS_BASE_URL=http://localhost:8000
OPENAI_API_KEY=<your-local-key>
```

## Security

- **Redis**: Uses both Entra ID (for your app) and access keys (for AMS)
- **OpenAI**: Uses API keys (retrieved via Bicep)
- **AMS**: Uses OAuth2 with Azure AD tokens (your app gets tokens automatically via managed identity)
- **All traffic**: TLS/HTTPS enforced

## Cost Considerations

Approximate monthly costs (East US, as of 2025):

- **Redis (Balanced_B1)**: ~$100/month
- **Azure OpenAI**: Pay per token (varies by usage)
- **Container Apps**: ~$25/month (1 replica, 0.5 CPU, 1GB RAM)
- **Azure Functions (Consumption)**: ~$0-5/month (first 1M executions free)
- **Static Web Apps (Free tier)**: $0/month (2 apps)
- **Storage Account**: ~$1/month (Functions storage)
- **Log Analytics**: ~$5-10/month

**Total**: ~$130-145/month + token usage

## Scaling

To scale up:

```bash
# Larger Redis
--parameters redisSku=Balanced_B10

# More Container App replicas (auto-scales up to 3 by default)
# Edit modules/container-apps.bicep to increase maxReplicas
```

## Cleanup

To delete everything:

```bash
az group delete --name agents-arbiters-rg --yes
```

Don't forget to also delete the App Registration:

```bash
az ad app delete --id <app-id>
```

## Troubleshooting

### Deployment Fails

Check Bicep validation:

```bash
az deployment group validate \
  --resource-group agents-arbiters-rg \
  --template-file main.bicep \
  --parameters appName=agents-arbiters ...
```

### Can't Connect to Redis

Verify network access and get the access key:

```bash
az redis enterprise database list-keys \
  --resource-group agents-arbiters-rg \
  --cluster-name agents-arbiters-redis \
  --database-name default
```

### AMS Returns 401 Unauthorized

Verify your app's managed identity has the correct permissions and the OAuth2 configuration is correct:

```bash
# Check Container App environment variables
az containerapp show \
  --name agents-arbiters-ams \
  --resource-group agents-arbiters-rg \
  --query properties.template.containers[0].env
```

## Module Structure

- **`main.bicep`** - Orchestrates all modules
- **`modules/azure-managed-redis.bicep`** - Redis Enterprise with RedisJSON and RediSearch
- **`modules/azure-openai.bicep`** - OpenAI account with three model deployments
- **`modules/container-apps.bicep`** - Container Apps Environment + AMS
- **`modules/azure-functions.bicep`** - Functions app with consumption plan
- **`modules/static-web-app-web.bicep`** - Game frontend SWA
- **`modules/static-web-app-admin.bicep`** - Admin dashboard SWA
- **`scripts/create-app-registration.sh`** - Helper script for App Registration

## Architecture Decisions

### Why Separate Functions + SWA?

Both Static Web Apps (`@ana/web` and `@ana/admin`) need to call the same API backend. Azure SWA's integrated Functions model tightly couples each SWA to its own Functions app, making sharing difficult.

**Our solution**: Deploy Functions as a standalone app, then configure both SWAs to proxy `/api/*` requests to the same Functions URL. This matches the local development setup and provides:
- Shared API backend for multiple frontends
- Independent scaling of backend vs frontends
- Clean separation of concerns
- Easy to add more frontends later

### Why Free Tier SWA?

The Free tier provides:
- 100 GB bandwidth/month per app
- Custom domains with auto SSL
- Global CDN distribution
- Perfect for demo/development projects

If needed, upgrade to Standard tier for:
- Multiple custom domains
- More bandwidth
- Private endpoints
