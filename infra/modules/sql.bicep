@description('Location for resources')
param location string = resourceGroup().location

@minLength(3)
@maxLength(63)
@description('SQL server name (unique within Azure)')
param sqlServerName string

@minLength(1)
@maxLength(128)
@description('SQL administrator login')
param sqlAdministratorLogin string

@secure()
@minLength(8)
@description('SQL administrator password (set securely in parameters or pipeline)')
param sqlAdministratorPassword string

@minLength(1)
@maxLength(128)
@description('Database name')
param databaseName string = 'FleetDb'

@description('Tags to apply to resources')
param resourceTags object = {}

resource sqlServer 'Microsoft.Sql/servers@2021-02-01-preview' = {
  name: sqlServerName
  location: location
  tags: resourceTags
  properties: {
    administratorLogin: sqlAdministratorLogin
    administratorLoginPassword: sqlAdministratorPassword
    version: '12.0'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2021-02-01-preview' = {
  name: '${sqlServer.name}/${databaseName}'
  location: location
  tags: resourceTags
  sku: {
    name: 'Basic'
  }
  properties: {}
  dependsOn: [ sqlServer ]
}

resource allowAzureServices 'Microsoft.Sql/servers/firewallRules@2021-02-01-preview' = {
  name: '${sqlServer.name}/AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
  dependsOn: [ sqlServer ]
}

output sqlServerName string = sqlServer.name
output sqlDatabaseName string = sqlDatabase.name
output sqlConnectionString string = 'Server=tcp:${sqlServer.name}.database.windows.net,1433;Initial Catalog=${databaseName};Persist Security Info=False;User ID=${sqlAdministratorLogin};Password=${sqlAdministratorPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
