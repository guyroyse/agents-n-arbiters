metadata description = 'Creates an Azure Container App running LiteLLM proxy to provide OpenAI-compatible API for Azure OpenAI.'

param location string = resourceGroup().location
param resourceToken string
param containerAppsEnvironmentId string
@secure()
param litellmMasterKey string
@secure()
param azureOpenAiApiKey string
param azureOpenAiEndpoint string
param gpt4oDeploymentName string
param gpt4oMiniDeploymentName string
param embeddingDeploymentName string

// LiteLLM Proxy Container App
resource litellm 'Microsoft.App/containerApps@2025-07-01' = {
  name: 'litellm-${resourceToken}'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      ingress: {
        external: true  // External access required for Azure Functions (Consumption Plan)
        targetPort: 4000
        transport: 'http'
        allowInsecure: false
      }
    }
    template: {
      containers: [
        {
          name: 'litellm'
          image: 'ghcr.io/berriai/litellm:main-stable'
          command: ['/bin/sh', '-c', 'echo "$LITELLM_CONFIG" > /app/config.yaml && litellm --config /app/config.yaml --port 4000']
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'LITELLM_MASTER_KEY'
              value: litellmMasterKey
            }
            {
              name: 'LITELLM_LOG'
              value: 'INFO'
            }
            {
              name: 'LITELLM_CONFIG'
              value: loadTextContent('./litellm.config.yaml')
            }
            {
              name: 'GPT4O_DEPLOYMENT_NAME'
              value: 'azure/${gpt4oDeploymentName}'
            }
            {
              name: 'GPT4O_MINI_DEPLOYMENT_NAME'
              value: 'azure/${gpt4oMiniDeploymentName}'
            }
            {
              name: 'EMBEDDING_DEPLOYMENT_NAME'
              value: 'azure/${embeddingDeploymentName}'
            }
            {
              name: 'AZURE_OPENAI_ENDPOINT'
              value: azureOpenAiEndpoint
            }
            {
              name: 'AZURE_OPENAI_API_KEY'
              value: azureOpenAiApiKey
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
output id string = litellm.id
output name string = litellm.name
output uri string = 'https://${litellm.properties.configuration.ingress.fqdn}'
output fqdn string = litellm.properties.configuration.ingress.fqdn

