@description('Location for resources')
param location string = resourceGroup().location

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

var sku = {
  name: 'B1'
  tier: 'Basic'
}

resource plan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: appServicePlanName
  location: location
  sku: sku
  properties: {
    reserved: true // Linux
  }
}

resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
  }
  kind: 'app,linux'
}

resource storage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
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

output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output storageAccountNameOut string = storage.name
