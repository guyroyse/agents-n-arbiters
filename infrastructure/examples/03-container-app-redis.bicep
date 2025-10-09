// Container App with Redis Cache Example
// Perfect for your Agent Memory Server + Redis setup

@description('The name prefix for all resources')
param appName string

@description('The location for all resources')
param location string = resourceGroup().location

@description('Container image for the Agent Memory Server')
param containerImage string = 'redislabs/agent-memory-server:latest'

@description('OpenAI API Key')
@secure()
param openAiApiKey string

// Variables
var containerAppEnvName = '${appName}-env'
var containerAppName = '${appName}-ams'
var redisCacheName = '${appName}-redis'
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

// Redis Cache
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisCacheName
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0  // C0 = 250MB, perfect for development
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
  }
}

// Container Apps Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
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
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        allowInsecure: false
      }
      secrets: [
        {
          name: 'openai-api-key'
          value: openAiApiKey
        }
        {
          name: 'redis-connection-string'
          value: '${redisCache.properties.hostName}:${redisCache.properties.sslPort},password=${redisCache.listKeys().primaryKey},ssl=True'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'agent-memory-server'
          image: containerImage
          env: [
            {
              name: 'PORT'
              value: '8000'
            }
            {
              name: 'OPENAI_API_KEY'
              secretRef: 'openai-api-key'
            }
            {
              name: 'REDIS_URL'
              secretRef: 'redis-connection-string'
            }
            {
              name: 'LONG_TERM_MEMORY'
              value: 'false'
            }
            {
              name: 'AUTH_MODE'
              value: 'disabled'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

@description('The Container App URL')
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'

@description('Redis hostname')
output redisHostname string = redisCache.properties.hostName

@description('Redis SSL port')
output redisSslPort int = redisCache.properties.sslPort