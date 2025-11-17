// Azure Functions module for Agents & Arbiters API
// Provides the backend API endpoints for game logic

@description('The name prefix for Functions resources')
param appName string

@description('The location for Functions resources')
param location string

@description('Redis hostname for game state storage')
param redisHostname string

@description('Redis port')
param redisPort int

@description('Azure OpenAI endpoint')
param openAiEndpoint string

@description('Azure OpenAI deployment name for chat')
param openAiDeploymentName string

@description('Azure OpenAI API key')
@secure()
param openAiApiKey string

@description('Agent Memory Server URL')
param amsUrl string

@description('AMS OAuth2 scope for token acquisition')
param amsScope string

@description('AMS context window maximum')
param amsContextWindowMax int = 4000

// Variables
var functionAppName = '${appName}-api'
var appServicePlanName = '${appName}-plan'
var storageAccountName = '${replace(appName, '-', '')}storage'

// Storage Account (required for Functions)
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

// App Service Plan (Consumption for serverless)
resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {}
}

// Function App
resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      nodeVersion: '~20'
      cors: {
        allowedOrigins: [
          'https://*.azurestaticapps.net'
        ]
        supportCredentials: false
      }
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(functionAppName)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'REDIS_URL'
          value: '${redisHostname}:${redisPort}'
        }
        {
          name: 'OPENAI_ENDPOINT'
          value: openAiEndpoint
        }
        {
          name: 'OPENAI_DEPLOYMENT'
          value: openAiDeploymentName
        }
        {
          name: 'OPENAI_API_KEY'
          value: openAiApiKey
        }
        {
          name: 'AMS_BASE_URL'
          value: amsUrl
        }
        {
          name: 'AMS_SCOPE'
          value: amsScope
        }
        {
          name: 'AMS_CONTEXT_WINDOW_MAX'
          value: string(amsContextWindowMax)
        }
      ]
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
    }
  }
}

@description('The Function App URL')
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'

@description('The Function App name')
output functionAppName string = functionApp.name

@description('The Function App resource ID')
output functionAppId string = functionApp.id

@description('The Function App managed identity principal ID')
output principalId string = functionApp.identity.principalId
