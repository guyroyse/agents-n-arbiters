// Azure OpenAI Service module
// Provides GPT-4 and embedding models for the game agents and AMS

@description('The name of the Azure OpenAI account')
param accountName string

@description('The location for the Azure OpenAI account')
param location string

@description('The SKU for the Azure OpenAI service')
param sku string = 'S0'

// Azure OpenAI Account (Cognitive Services)
resource openAiAccount 'Microsoft.CognitiveServices/accounts@2025-09-05' = {
  name: accountName
  location: location
  kind: 'OpenAI'
  sku: {
    name: sku
  }
  properties: {
    customSubDomainName: accountName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

// GPT-4o Deployment (full model for complex tasks)
resource gpt4oDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-09-05' = {
  parent: openAiAccount
  name: 'gpt-4o'
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: '2024-08-06'
    }
  }
  sku: {
    name: 'Standard'
    capacity: 30
  }
}

// GPT-4o-mini Deployment (main model for game agents)
resource gpt4oMiniDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-09-05' = {
  parent: openAiAccount
  name: 'gpt-4o-mini'
  dependsOn: [gpt4oDeployment]
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o-mini'
      version: '2024-07-18'
    }
  }
  sku: {
    name: 'Standard'
    capacity: 30
  }
}

// Text Embedding Deployment (for AMS semantic search)
resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-09-05' = {
  parent: openAiAccount
  name: 'text-embedding-3-small'
  dependsOn: [gpt4oMiniDeployment]
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-3-small'
      version: '1'
    }
  }
  sku: {
    name: 'Standard'
    capacity: 30
  }
}

@description('The Azure OpenAI endpoint')
output endpoint string = openAiAccount.properties.endpoint

@description('The Azure OpenAI account name')
output accountName string = openAiAccount.name

@description('The Azure OpenAI resource ID')
output resourceId string = openAiAccount.id

@description('GPT-4o deployment name')
output gpt4oDeploymentName string = gpt4oDeployment.name

@description('GPT-4o-mini deployment name')
output gpt4oMiniDeploymentName string = gpt4oMiniDeployment.name

@description('Text embedding deployment name')
output embeddingDeploymentName string = embeddingDeployment.name
