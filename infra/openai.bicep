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

// Model Deployment: gpt-4o (for primary game generation)
resource gpt4oDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-09-01' = {
  parent: openAiAccount
  name: 'gpt-4o'
  sku: {
    name: 'Standard'
    capacity: 30
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: '2024-08-06'
    }
  }
}

// Model Deployment: gpt-4o-mini (for AMS and lighter tasks)
resource gpt4oMiniDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-09-01' = {
  parent: openAiAccount
  name: 'gpt-4o-mini'
  sku: {
    name: 'Standard'
    capacity: 30
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o-mini'
      version: '2024-07-18'
    }
  }
  dependsOn: [
    gpt4oDeployment
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
    gpt4oMiniDeployment
  ]
}

// Outputs
output id string = openAiAccount.id
output name string = openAiAccount.name
output endpoint string = openAiAccount.properties.endpoint
output apiKey string = openAiAccount.listKeys().key1
output gpt4oDeploymentName string = gpt4oDeployment.name
output gpt4oMiniDeploymentName string = gpt4oMiniDeployment.name
output embeddingDeploymentName string = embeddingDeployment.name
