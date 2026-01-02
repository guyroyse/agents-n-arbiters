metadata description = 'Creates an Application Insights instance and a Log Analytics workspace for monitoring and telemetry.'

param location string = resourceGroup().location
param resourceToken string

// Log Analytics Workspace - stores logs and metrics
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2025-02-01' = {
  name: 'log-${resourceToken}'
  location: location
  properties: {
    retentionInDays: 30
    sku: {
      name: 'PerGB2018'
    }
  }
}

// Application Insights - application monitoring and telemetry
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'app-insights-${resourceToken}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
  }
}

// Outputs
output logAnalyticsWorkspaceId string = logAnalytics.id
output logAnalyticsWorkspaceName string = logAnalytics.name
output applicationInsightsId string = applicationInsights.id
output applicationInsightsName string = applicationInsights.name
output applicationInsightsConnectionString string = applicationInsights.properties.ConnectionString
output applicationInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey
