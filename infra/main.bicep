// Main deployment file for Agents & Arbiters
// Orchestrates all Azure resources needed for the game

@description('The name prefix for all resources')
param appName string

@description('The location for all resources')
param location string = resourceGroup().location

@description('Redis SKU (e.g., Balanced_B1, Balanced_B10, Memory_M10)')
param redisSku string = 'Balanced_B1'

@description('AMS App Registration Client ID (from create-app-registration.sh)')
param amsAppId string

@description('Azure AD Tenant ID (from create-app-registration.sh)')
param amsTenantId string

// Module: Azure OpenAI Service
module openai './modules/azure-openai.bicep' = {
  name: 'openai-deployment'
  params: {
    accountName: '${appName}-openai'
    location: location
  }
}

// Module: Azure Managed Redis
module redis './modules/azure-managed-redis.bicep' = {
  name: 'redis-deployment'
  params: {
    redisName: '${appName}-redis'
    location: location
    skuName: redisSku
  }
}

// Note: We need existing resource references to call listKeys()
// Reference the Redis Enterprise resource
resource existingRedis 'Microsoft.Cache/redisEnterprise@2025-07-01' existing = {
  name: '${appName}-redis'
}

// Reference the OpenAI account
resource existingOpenAi 'Microsoft.CognitiveServices/accounts@2025-09-05' existing = {
  name: '${appName}-openai'
}

// Module: Container Apps (Agent Memory Server)
module containerApps './modules/container-apps.bicep' = {
  name: 'container-apps-deployment'
  dependsOn: [redis, openai]
  params: {
    appName: appName
    location: location
    redisHostname: redis.outputs.hostname
    redisPort: redis.outputs.port
    redisAccessKey: existingRedis.listKeys().primaryKey
    openAiEndpoint: openai.outputs.endpoint
    openAiEmbeddingDeployment: openai.outputs.embeddingDeploymentName
    openAiChatDeployment: openai.outputs.gpt4oMiniDeploymentName
    openAiApiKey: existingOpenAi.listKeys().key1
    oauth2IssuerUrl: 'https://login.microsoftonline.com/${amsTenantId}/v2.0'
    oauth2Audience: amsAppId
  }
}

// Module: Azure Functions (API Backend)
module functions './modules/azure-functions.bicep' = {
  name: 'functions-deployment'
  dependsOn: [redis, openai, containerApps]
  params: {
    appName: appName
    location: location
    redisHostname: redis.outputs.hostname
    redisPort: redis.outputs.port
    openAiEndpoint: openai.outputs.endpoint
    openAiDeploymentName: openai.outputs.gpt4oMiniDeploymentName
    openAiApiKey: existingOpenAi.listKeys().key1
    amsUrl: containerApps.outputs.amsUrl
    amsScope: 'api://${amsAppId}/.default'
  }
}

// Module: Static Web App for game frontend
module webApp './modules/static-web-app-web.bicep' = {
  name: 'web-app-deployment'
  dependsOn: [functions]
  params: {
    appName: appName
    location: location
    functionAppUrl: functions.outputs.functionAppUrl
  }
}

// Outputs
@description('Azure OpenAI endpoint')
output openAiEndpoint string = openai.outputs.endpoint

@description('Azure OpenAI account name for key retrieval')
output openAiAccountName string = openai.outputs.accountName

@description('GPT-4o deployment name')
output gpt4oDeploymentName string = openai.outputs.gpt4oDeploymentName

@description('GPT-4o-mini deployment name')
output gpt4oMiniDeploymentName string = openai.outputs.gpt4oMiniDeploymentName

@description('Text embedding deployment name')
output embeddingDeploymentName string = openai.outputs.embeddingDeploymentName

@description('Redis hostname')
output redisHostname string = redis.outputs.hostname

@description('Redis port')
output redisPort int = redis.outputs.port

@description('Agent Memory Server URL')
output amsUrl string = containerApps.outputs.amsUrl

@description('AMS OAuth2 Scope')
output amsScope string = 'api://${appName}-ams/.default'

@description('Azure Functions URL')
output functionAppUrl string = functions.outputs.functionAppUrl

@description('Azure Functions name')
output functionAppName string = functions.outputs.functionAppName

@description('Game frontend URL')
output webAppUrl string = webApp.outputs.staticWebAppUrl
