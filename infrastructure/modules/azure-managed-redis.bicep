// Azure Managed Redis module
// Provides Redis with RedisJSON and RediSearch capabilities

@description('The name of the Azure Managed Redis instance')
param redisName string

@description('The location for the Redis instance')
param location string

@description('The SKU name for Azure Managed Redis (e.g., Balanced_B1, Memory_M10)')
param skuName string = 'Balanced_B1'

// Azure Managed Redis Cluster
resource redisEnterprise 'Microsoft.Cache/redisEnterprise@2025-07-01' = {
  name: redisName
  location: location
  sku: {
    name: skuName
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    minimumTlsVersion: '1.2'
  }
}

// Default database with RedisJSON and RediSearch modules
resource redisDatabase 'Microsoft.Cache/redisEnterprise/databases@2025-07-01' = {
  parent: redisEnterprise
  name: 'default'
  properties: {
    clientProtocol: 'Encrypted'
    port: 10000
    clusteringPolicy: 'EnterpriseCluster'
    evictionPolicy: 'NoEviction'
    // Enable both Entra ID and access keys (AMS needs access keys)
    accessKeysAuthentication: 'Enabled'
    modules: [
      {
        name: 'RedisJSON'
      }
      {
        name: 'RediSearch'
      }
    ]
  }
}

@description('The Redis Enterprise resource ID')
output redisId string = redisEnterprise.id

@description('The Redis hostname')
output hostname string = redisEnterprise.properties.hostName

@description('The Redis port')
output port int = redisDatabase.properties.port

@description('The database resource name for key access')
output databaseName string = redisDatabase.name
