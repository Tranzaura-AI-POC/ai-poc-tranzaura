// Example: pass tags and environment-specific values into Bicep templates
@description('Location for resources')
param location string = resourceGroup().location

@description('Environment tag (Dev/UAT/Prod)')
param environment string = 'Dev'

@description('Project name for tagging')
param project string = 'ai-poc-tranzaura'

@description('Owner for tagging')
param owner string = 'team-name'

@description('Tags to apply to all resources (can be overridden)')
param resourceTags object = {
  Environment: environment
  Project: project
  Owner: owner
}

// Example resource showing tags usage
resource exampleStorage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: 'examplestorage${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  tags: resourceTags
  properties: {
    minimumTlsVersion: 'TLS1_2'
  }
}

output exampleStorageName string = exampleStorage.name
