metadata description = 'Creates an Azure Container App running the Agent Memory Server (AMS) with Redis backend and LiteLLM proxy for OpenAI compatibility.'

param location string = resourceGroup().location
param resourceToken string
param containerAppsEnvironmentId string
param redisConnectionString string
@secure()
param openAiApiKey string  // LiteLLM master key
param openAiEndpoint string  // LiteLLM proxy URI
param tenantId string

// Agent Memory Server Container App
resource ams 'Microsoft.App/containerApps@2025-07-01' = {
  name: 'ams-${resourceToken}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        transport: 'http'
        allowInsecure: false
      }
    }
    template: {
      containers: [
        {
          name: 'ams'
          image: 'redislabs/agent-memory-server:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'REDIS_URL'
              value: redisConnectionString
            }
            {
              name: 'OPENAI_API_KEY'
              value: openAiApiKey
            }
            {
              name: 'OPENAI_API_BASE'
              value: openAiEndpoint
            }
            {
              name: 'AUTH_MODE'
              value: 'oauth2'
            }
            {
              name: 'OAUTH2_ISSUER_URL'
              value: 'https://login.microsoftonline.com/${tenantId}/v2.0'
            }
            {
              name: 'OAUTH2_AUDIENCE'
              value: 'api://ca-ams-${resourceToken}'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

// Outputs
output id string = ams.id
output name string = ams.name
output uri string = 'https://${ams.properties.configuration.ingress.fqdn}'
output fqdn string = ams.properties.configuration.ingress.fqdn

