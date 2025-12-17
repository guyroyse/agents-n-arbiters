metadata description = 'Creates an Azure Container Apps environment for hosting container applications.'

param location string = resourceGroup().location
param resourceToken string
param logAnalyticsWorkspaceId string

// Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2025-07-01' = {
  name: 'container-apps-env-${resourceToken}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: reference(logAnalyticsWorkspaceId, '2023-09-01').customerId
        sharedKey: listKeys(logAnalyticsWorkspaceId, '2023-09-01').primarySharedKey
      }
    }
  }
}

// Outputs
output id string = containerAppsEnvironment.id
output name string = containerAppsEnvironment.name
output defaultDomain string = containerAppsEnvironment.properties.defaultDomain

