param resourceToken string

// Azure OpenAI Service
var accountName = 'openai-${resourceToken}'
var location = resourceGroup().location

resource openAiAccount 'Microsoft.CognitiveServices/accounts@2025-09-01' = {
  name: accountName
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: accountName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

// Model Deployment: gpt-4.1 (for primary game generation)
resource gpt41Deployment 'Microsoft.CognitiveServices/accounts/deployments@2025-09-01' = {
  parent: openAiAccount
  name: 'gpt-4.1'
  sku: {
    name: 'DataZoneStandard'
    capacity: 30
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4.1'
      version: '2025-04-14'
    }
  }
}

// Model Deployment: gpt-4.1-mini (for AMS and lighter tasks)
resource gpt41MiniDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-09-01' = {
  parent: openAiAccount
  name: 'gpt-4.1-mini'
  sku: {
    name: 'DataZoneStandard'
    capacity: 30
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4.1-mini'
      version: '2025-04-14'
    }
  }
  dependsOn: [
    gpt41Deployment
  ]
}

// Model Deployment: text-embedding-3-small (for AMS semantic search)
resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-09-01' = {
  parent: openAiAccount
  name: 'text-embedding-3-small'
  sku: {
    name: 'Standard'
    capacity: 30
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-3-small'
      version: '1'
    }
  }
  dependsOn: [
    gpt41MiniDeployment
  ]
}

// Outputs
output id string = openAiAccount.id
output name string = openAiAccount.name
output endpoint string = openAiAccount.properties.endpoint
output apiKey string = openAiAccount.listKeys().key1
output primaryDeploymentName string = gpt41Deployment.name
output miniDeploymentName string = gpt41MiniDeployment.name
output embeddingDeploymentName string = embeddingDeployment.name
