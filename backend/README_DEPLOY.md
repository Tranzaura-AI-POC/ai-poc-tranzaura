# Backend deployment notes

Purpose: quick reference for production configuration, Key Vault usage, and run/build commands for the backend service.

Required production configuration

- `FRONTEND_ORIGIN` : The frontend origin (e.g. `https://app.example.com`). The app will fail to start in Production if this is not set.
- `FLEET_CONNECTION_STRING` or configured `ConnectionStrings:FleetDatabase` : SQL Server connection string for production.
- Azure AD (for JWT):
  - `AzureAd:TenantId` and `AzureAd:ClientId` (or `AzureAd:Authority` / `AzureAd:Audience`) — used when enabling Azure AD authentication.
- Optional: `KEYVAULT_URI` or `KeyVault:Uri` : If present the app will load secrets from Azure Key Vault using `DefaultAzureCredential` (Managed Identity recommended).

Key Vault and secrets

- Store production connection string under a secret name referenced by the configuration key `ConnectionStrings:FleetDatabase` (or set `FLEET_CONNECTION_STRING` env var).
- Use Managed Identity for the App Service / VM / Container to grant access to Key Vault; avoid storing credentials in source or plain env files.

Local dev notes

- If no production connection string is provided and `ASPNETCORE_ENVIRONMENT` is `Development`, the app will use a local SQLite file `fleet.db`.
- Swagger is enabled in Development only.

Run / build

- Build backend:

```powershell
cd backend
dotnet build
```

- Run locally:

```powershell
cd backend
dotnet run
```

- Frontend quick build & serve (from repo root `frontend`):

```bash
npm install
npm run build
# or for dev
npm start
```

Security notes

- Authentication: The project now supports Azure AD / JWT Bearer authentication — ensure AD config values are set for production.
- CORS: `FRONTEND_ORIGIN` must be set to a single trusted origin in production.
- Package advisories: `Azure.Identity` currently shows advisories; review and upgrade packages as advisories are patched.
- CI: add `dotnet list package --vulnerable` and `npm audit` to CI, and enable secret scanning in your repo hosting provider.

Contact

- If you want, I can add a short `azure-pipelines.yml` or GitHub Actions workflow to deploy the backend with Key Vault and managed identity — tell me which CI/CD provider to target.
