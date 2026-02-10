@description('Location for resources')
param location string = resourceGroup().location

@description('Environment tag (Dev/UAT/Prod)')
param environment string

@description('Project name for tagging')
param project string = 'ai-poc-tranzaura'

@description('Owner for tagging')
param owner string = 'team-name'

@description('Tags to apply to resources (Environment/Project/Owner)')
param resourceTags object = {
  Environment: environment
  Project: project
  Owner: owner
}

@minLength(3)
@maxLength(60)
@description('Name for the App Service plan')
param appServicePlanName string = 'ai-poc-plan-dev'

@minLength(2)
@maxLength(60)
@description('Name for the Web App (backend)')
param webAppName string = 'ai-poc-backend-dev'

@minLength(3)
@maxLength(24)
@description('Storage account name for frontend static website (lowercase)')
param storageAccountName string

@minLength(3)
@maxLength(63)
@description('SQL server name (unique within Azure)')
param sqlServerName string = 'ai-poc-sql-dev'

@minLength(1)
@maxLength(128)
@description('SQL administrator login')
param sqlAdministratorLogin string = 'sqladmin'

@secure()
@minLength(8)
@description('SQL administrator password (set securely in parameters or pipeline)')
param sqlAdministratorPassword string

@minLength(1)
@maxLength(128)
@description('Database name')
param databaseName string = 'FleetDb'

var sku = {
  name: 'B1'
  tier: 'Basic'
}

resource plan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: appServicePlanName
  location: location
  tags: resourceTags
  sku: sku
  properties: {
    reserved: true // Linux
  }
}

resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: webAppName
  location: location
  tags: resourceTags
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
  }
  kind: 'app,linux'
}

resource storage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  tags: resourceTags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource staticWebsite 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
  name: '${storage.name}/default'
  parent: storage
}

// Enable static website (deployment tasks will upload to $web container)
resource staticContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: '${storage.name}/default/$web'
  parent: storage
  properties: {
    publicAccess: 'None'
  }
}
// Dev-only: deploy an Azure SQL module when `environment` == 'Dev'
module sqlModule 'modules/sql.bicep' = if (environment == 'Dev') {
  name: 'devSql'
  params: {
    location: location
    sqlServerName: sqlServerName
    sqlAdministratorLogin: sqlAdministratorLogin
    sqlAdministratorPassword: sqlAdministratorPassword
    databaseName: databaseName
    resourceTags: resourceTags
  }
}

output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output storageAccountNameOut string = storage.name
output sqlServerNameOut string = sqlServerName
output sqlDatabaseNameOut string = databaseName
// Connection string (dev convenience). For production, prefer Key Vault and not exposing passwords.
output sqlConnectionString string = 'Server=tcp:${sqlServerName}.database.windows.net,1433;Initial Catalog=${databaseName};Persist Security Info=False;User ID=${sqlAdministratorLogin};Password=${sqlAdministratorPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
