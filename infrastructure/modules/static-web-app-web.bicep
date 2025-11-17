// Azure Static Web App module for @ana/web (game frontend)
// Provides the player-facing game interface

@description('The name prefix for the web Static Web App')
param appName string

@description('The location for the Static Web App')
param location string

@description('The Function App URL for API backend')
param functionAppUrl string

// Variables
var staticWebAppName = '${appName}-web'

// Static Web App for game frontend
resource staticWebApp 'Microsoft.Web/staticSites@2024-04-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: ''
    branch: ''
    provider: 'Custom'
    buildProperties: {
      appLocation: 'static-web-apps/ana-web'
      outputLocation: 'dist'
    }
  }
}

// Configure backend API proxy
resource staticWebAppConfig 'Microsoft.Web/staticSites/config@2024-04-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    BACKEND_API_URL: functionAppUrl
  }
}

// Linked backend configuration for /api/* routing
resource linkedBackend 'Microsoft.Web/staticSites/linkedBackends@2024-04-01' = {
  parent: staticWebApp
  name: 'backend'
  properties: {
    backendResourceId: ''
    region: location
  }
}

@description('The Static Web App URL')
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'

@description('The Static Web App name')
output staticWebAppName string = staticWebApp.name

@description('The Static Web App resource ID')
output staticWebAppId string = staticWebApp.id

@description('The Static Web App deployment token (for CI/CD)')
@secure()
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
