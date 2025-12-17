metadata description = 'Creates an Azure Function App for Agents & Arbiters API.'

// User-defined types for configuration objects
type OpenAiConfig = {
  endpoint: string
  deploymentName: string
  @secure()
  apiKey: string
  apiVersion: string?
}

type AmsConfig = {
  baseUrl: string
  contextWindowMax: string?
}

param location string = resourceGroup().location
param resourceToken string

param redisConnectionString string
param openAiConfig OpenAiConfig
param amsConfig AmsConfig

param functionsIdentityId string
param applicationInsightsConnectionString string

// Storage Account for Function App
resource storageAccount 'Microsoft.Storage/storageAccounts@2025-06-01' = {
  name: 'stfn${resourceToken}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
  }
}

// App Service Plan (Consumption)
resource appServicePlan 'Microsoft.Web/serverfarms@2025-03-01' = {
  name: 'plan-fn-${resourceToken}'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2025-03-01' = {
  name: 'func-${resourceToken}'
  location: location
  kind: 'functionapp,linux'
  tags: {
    'azd-service-name': 'api'
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${functionsIdentityId}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20'
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
          value: toLower('func-${resourceToken}')
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
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsightsConnectionString
        }
        {
          name: 'OPENAI_API_KEY'
          value: openAiConfig.apiKey  // LiteLLM master key
        }
        {
          name: 'OPENAI_BASE_URL'
          value: openAiConfig.endpoint  // LiteLLM proxy URL
        }
        {
          name: 'REDIS_URL'
          value: redisConnectionString
        }
        {
          name: 'AMS_BASE_URL'
          value: amsConfig.baseUrl
        }
        {
          name: 'AMS_CONTEXT_WINDOW_MAX'
          value: amsConfig.?contextWindowMax ?? '4000'
        }
      ]
      cors: {
        allowedOrigins: [
          'https://portal.azure.com'
        ]
      }
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
    }
  }
}

// Outputs
output id string = functionApp.id
output name string = functionApp.name
output uri string = 'https://${functionApp.properties.defaultHostName}'
output defaultHostName string = functionApp.properties.defaultHostName

