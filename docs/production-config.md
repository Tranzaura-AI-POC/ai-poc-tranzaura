# Production Configuration Notes

Store secrets in Azure Key Vault and reference them via Managed Identity in the app configuration.
Required secrets / config keys:
  - `ConnectionStrings:FleetDatabase` — Azure SQL connection string
  - `FrontendOrigin` — production frontend origin (e.g., https://app.example.com)
  - `AzureAd:TenantId`, `AzureAd:ClientId`, `AzureAd:Audience`, `AzureAd:Authority`
  - `DataProtection` settings if using external key storage
  - `ApplicationInsights:ConnectionString` (optional)

Recommended environment variables in Azure App Service / Container Apps:
  - `ASPNETCORE_ENVIRONMENT=Production`
  - `FRONTEND_ORIGIN=https://app.example.com`
  - `APPLY_MIGRATIONS=false` (set to true for controlled migrations)
  - `ENABLE_SEEDING=false` (avoid seeding in production)

Key Vault:
  - Create Key Vault and enable soft-delete + purge protection.
  - Store above secrets and grant your App Service/Container a system-assigned Managed Identity.
  - Grant the identity `Key Vault Secrets User` access (or use RBAC) to retrieve secrets.

Data Protection:
  - Persist DataProtection keys to Blob Storage or Key Vault in production.
  - For App Service, consider using blob storage container for keys and set `DataProtectionPath` accordingly or use the Azure-specific provider.

Database:
  - Use Azure SQL with Private Endpoint / VNet integration or firewall rules limiting access to App Service outbound IPs.
  - Enable Transparent Data Encryption and backup policies.