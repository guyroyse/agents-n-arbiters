metadata description = 'Creates an Azure Static Web App for Agents & Arbiters frontend.'

param location string = resourceGroup().location
param resourceToken string

// Azure Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2025-03-01' = {
  name: 'swa-${resourceToken}'
  location: location
  tags: {
    'azd-service-name': 'web'
  }
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
}

// Outputs
output id string = staticWebApp.id
output name string = staticWebApp.name
output uri string = 'https://${staticWebApp.properties.defaultHostname}'
output defaultHostname string = staticWebApp.properties.defaultHostname

