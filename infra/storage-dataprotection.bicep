@description('Location for all resources')
param location string = resourceGroup().location

@minLength(3)
@maxLength(24)
@description('Unique name for the Storage Account (lowercase, 3-24 chars)')
param storageAccountName string

@description('Blob container name for DataProtection keys')
param containerName string = 'dataprotection'

@description('ObjectId of the principal to grant access (Managed Identity or Service Principal)')
param principalId string

@description('Principal type: ServicePrincipal | User | Group | ServicePrincipal (default for MSI)')
param principalType string = 'ServicePrincipal'

@description('Role definition GUID to assign (Storage Blob Data Contributor by default)')
param roleDefinitionGuid string = 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b'

var storageSku = 'Standard_LRS'

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: storageSku
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2022-09-01' = {
  name: '${storageAccount.name}/default'
  parent: storageAccount
}

resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: '${storageAccount.name}/default/${containerName}'
  parent: storageAccount
  properties: {
    publicAccess: 'None'
  }
}

// Role assignment scoped to the container resource
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2020-04-01-preview' = {
  name: guid(storageAccount.id, container.id, principalId, roleDefinitionGuid)
  scope: container
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionGuid)
    principalId: principalId
    principalType: principalType
  }
}

output storageAccountName string = storageAccount.name
output containerUri string = 'https://${storageAccount.name}.blob.core.windows.net/${containerName}'
output roleAssignmentId string = roleAssignment.id
