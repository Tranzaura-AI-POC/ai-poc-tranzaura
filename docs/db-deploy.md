# Database deployment and pipeline migration steps

This project uses EF Core with SQL Server for production and a local SQL Server fallback for developer machines.

Summary
- Local dev: no change — `Program.cs` falls back to a local SQL Server instance when no connection string is provided.
- Production: use Azure SQL Database and inject a connection string into the pipeline or App Service.

Recommended pipeline secret
- Add a secret pipeline variable named `FLEET_CONNECTION_STRING` (marked as secret). Value should be a full SQL Server connection string, e.g.:

  Server=<your-sql-server>.database.windows.net;Database=FleetDb;User Id=<user>;Password=<password>;Trusted_Connection=False;Encrypt=True;TrustServerCertificate=False;

- The pipeline contains a migration step that will run `dotnet ef database update` against this connection string if the variable is present.

Pipeline migration example (already added)
- The pipeline step will:
  - install `dotnet-ef` global tool
  - run `dotnet ef database update --project backend/FleetManagement.csproj --startup-project backend --connection "$FLEET_CONNECTION_STRING"`

App Service configuration (two options)
1) Set a Connection String (recommended):
   - In the Azure Portal > App Service > Configuration > Connection strings, add a connection string named `FleetDatabase` with the full connection string value and type `SQLServer`.
   - ASP.NET will read this from `Configuration.GetConnectionString("FleetDatabase")` automatically.

2) Set an App Setting (already supported by program):
   - In App Service > Configuration > Application settings, add `FLEET_CONNECTION_STRING` with the full connection string as its value.
   - The pipeline migration step and `Program.cs` will also detect and use this variable.

Key Vault / Managed Identity (optional, recommended for security)
- Store the DB connection string in Azure Key Vault and reference it in your pipeline using a variable group linked to Key Vault, or set `KeyVault:Uri` / `KEYVAULT_URI` so `Program.cs` fetches secrets using `DefaultAzureCredential`.
- For secretless operation, consider enabling Managed Identity and configuring Azure AD authentication for Azure SQL. That requires:
  - Configure an Azure AD admin on the Azure SQL server
  - Grant your Web App's managed identity the appropriate database role (e.g. `db_owner` or a narrower role)
  - Update connection to use `Authentication=Active Directory Managed Identity` style connection string or use token-based auth in code.

Firewall & networking
- Lock down the Azure SQL firewall to only allow App Service outbound IPs or use VNet integration / Private Endpoint for stronger security.

Migrations strategy notes
- Pipeline-driven migrations (used here) give control and allow you to run migrations before swapping/deploy.
- App-driven migrations are supported by the app when `APPLY_MIGRATIONS=true`, but are riskier for production schema changes.

Rollback & backups
- Ensure automated backups and point-in-time restore are configured in the Azure SQL server.
- Test migrations in a staging/UAT environment before applying to production.

If you'd like, I can:
- add a pipeline variable group snippet for injecting `FLEET_CONNECTION_STRING` from Key Vault,
- modify the migration step to run earlier in the deploy job (pre-deploy), or
- implement Managed Identity examples for connecting to Azure SQL.
