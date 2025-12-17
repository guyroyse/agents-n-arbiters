metadata description = 'Creates user-assigned managed identity for Azure Functions.'

param resourceToken string

// User-assigned managed identity for Azure Functions
resource functionsIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: 'id-functions-${resourceToken}'
  location: resourceGroup().location
}

// Functions Identity Outputs
output functionsIdentityId string = functionsIdentity.id
output functionsIdentityName string = functionsIdentity.name
output functionsPrincipalId string = functionsIdentity.properties.principalId
output functionsClientId string = functionsIdentity.properties.clientId

