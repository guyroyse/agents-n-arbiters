param resourceToken string

// Azure Managed Redis Enterprise Cache
var resourceName = 'redis-${resourceToken}'
var location = resourceGroup().location

resource redisEnterprise 'Microsoft.Cache/redisEnterprise@2025-07-01' = {
  name: resourceName
  location: location
  sku: {
    name: 'Balanced_B1'
  }
  properties: {
    minimumTlsVersion: '1.2'
    highAvailability: 'Disabled'
    publicNetworkAccess: 'Enabled'
  }
}

// Redis Database (child resource)
resource database 'Microsoft.Cache/redisEnterprise/databases@2025-07-01' = {
  parent: redisEnterprise
  name: 'default'
  properties: {
    clientProtocol: 'Encrypted'
    port: 10000
    clusteringPolicy: 'EnterpriseCluster'
    evictionPolicy: 'NoEviction'
    accessKeysAuthentication: 'Enabled'
    modules: [
      {
        name: 'RediSearch'
      }
      {
        name: 'RedisJSON'
      }
    ]
  }
}

// Outputs
output id string = redisEnterprise.id
output name string = redisEnterprise.name
output hostName string = redisEnterprise.properties.hostName
output port int = database.properties.port
output databaseId string = database.id
output primaryKey string = database.listKeys().primaryKey
output connectionString string = 'rediss://:${database.listKeys().primaryKey}@${redisEnterprise.properties.hostName}:${database.properties.port}'
