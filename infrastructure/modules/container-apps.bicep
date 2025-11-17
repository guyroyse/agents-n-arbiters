// Azure Container Apps module for Agent Memory Server
// Provides persistent conversation memory and semantic search

@description('The name prefix for Container Apps resources')
param appName string

@description('The location for Container Apps resources')
param location string

@description('Redis hostname for AMS connection')
param redisHostname string

@description('Redis port')
param redisPort int

@description('Redis access key (AMS uses password auth)')
@secure()
param redisAccessKey string

@description('Azure OpenAI endpoint')
param openAiEndpoint string

@description('Azure OpenAI deployment name for embeddings')
param openAiEmbeddingDeployment string

@description('Azure OpenAI deployment name for chat')
param openAiChatDeployment string

@description('Azure OpenAI API key')
@secure()
param openAiApiKey string

@description('OAuth2 issuer URL for AMS authentication')
param oauth2IssuerUrl string

@description('OAuth2 audience (App Registration client ID)')
param oauth2Audience string

// Variables
var containerAppEnvName = '${appName}-env'
var containerAppName = '${appName}-ams'
var logAnalyticsName = '${appName}-logs'

// Log Analytics Workspace (required for Container Apps)
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Container Apps Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Agent Memory Server Container App
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        allowInsecure: false
        transport: 'http'
      }
      secrets: [
        {
          name: 'redis-access-key'
          value: redisAccessKey
        }
        {
          name: 'openai-api-key'
          value: openAiApiKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'agent-memory-server'
          image: 'redislabs/agent-memory-server:latest'
          env: [
            {
              name: 'PORT'
              value: '8000'
            }
            {
              name: 'REDIS_URL'
              value: '${redisHostname}:${redisPort}'
            }
            {
              name: 'REDIS_PASSWORD'
              secretRef: 'redis-access-key'
            }
            {
              name: 'OPENAI_API_BASE'
              value: openAiEndpoint
            }
            {
              name: 'OPENAI_API_KEY'
              secretRef: 'openai-api-key'
            }
            {
              name: 'OPENAI_EMBEDDING_MODEL'
              value: openAiEmbeddingDeployment
            }
            {
              name: 'OPENAI_CHAT_MODEL'
              value: openAiChatDeployment
            }
            {
              name: 'AUTH_MODE'
              value: 'oauth2'
            }
            {
              name: 'OAUTH2_ISSUER_URL'
              value: oauth2IssuerUrl
            }
            {
              name: 'OAUTH2_AUDIENCE'
              value: oauth2Audience
            }
            {
              name: 'LOG_LEVEL'
              value: 'INFO'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

@description('The Agent Memory Server URL')
output amsUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'

@description('The Container App resource ID')
output containerAppId string = containerApp.id

@description('The Log Analytics workspace ID')
output logAnalyticsId string = logAnalytics.id
