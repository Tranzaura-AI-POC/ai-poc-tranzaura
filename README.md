# ai-poc-tranzaura — Fleet Management POC

A small proof-of-concept web application for scheduling fleet service appointments.

Project structure
- `backend/` — .NET 8 Web API using Entity Framework Core.
	- `Data/` — EF DbContext and seed helpers.
	- `Controllers/` — API controllers (`AssetTypes`, `ServiceCenters`, `ServiceAppointments`).
	- `Repositories/` — data access abstraction.
- `frontend/` — Angular app (development server via `ng serve`).

Features
- Schedule service appointments (asset type, make, year, service center, date/time, notes).
- List appointments in a dedicated page.
- Simple REST API for CRUD operations.

Prerequisites
- .NET SDK 8+ (tested with .NET 8/10 SDK on Windows)
- Node.js 18+ and npm (for frontend)
- Optional: SQL Server (if you want to point the backend to an existing DB)

Quick start (development)

1) Backend (recommended: use SQLite fallback for local dev)

- Restore and build:

```
pushd backend
dotnet restore
dotnet build
```

- Run (uses a file-backed SQLite DB by default in Development):

```
pushd backend
dotnet run
```

By default the app listens on `http://localhost:5000` (and `https://localhost:5001` when HTTPS is enabled).

2) Frontend

- Install and run the Angular dev server:

```
pushd frontend
npm install
npm.cmd start
```

Open `http://127.0.0.1:4200`.

Database configuration options

- Use existing SQL Server instance (production or shared dev DB):
	- Set a connection string named `FleetDatabase` in `appsettings.json` or set the environment variable `FLEET_CONNECTION_STRING` before starting the backend. Example:

```
$env:FLEET_CONNECTION_STRING = 'Server=localhost\\MSSQLSERVER01;Database=FleetDb;Trusted_Connection=True;TrustServerCertificate=True;'
dotnet run --project backend
```

	- When a configured SQL connection is present, the app will NOT run automatic migrations/seed logic at startup (it assumes the database schema and data already exist). If you need migrations, run them explicitly in a safe environment.
# ai-poc-tranzaura — Fleet Management POC

A small proof-of-concept web application for scheduling fleet service appointments.

## Project structure
- `backend/` — .NET 8 Web API using Entity Framework Core.
  - `Data/` — EF DbContext and seed helpers.
  - `Controllers/` — API controllers (`AssetTypes`, `ServiceCenters`, `ServiceAppointments`).
  - `Repositories/` — data access abstraction.
- `frontend/` — Angular app (production builds output to `frontend/dist/fleet-frontend`).

## Highlights / recent changes
- Frontend now resolves the API base URL at runtime (see "Runtime API base" below). This prevents the SPA from calling the static website host for API requests when deployed to Azure Storage.
- The Azure pipeline injects the backend host into `index.html` at build/deploy time and sets `Cache-Control` headers so `index.html` is not cached while hashed assets are cached long-term.
- Backend seeding: the pipeline can enable DB seeding on deploy via `ENABLE_SEEDING=true` and will run EF migrations when `FLEET_CONNECTION_STRING` is provided.

## Prerequisites
- .NET SDK 8+
- Node 20.x (pipeline uses Node 20.19.0 for builds) and npm
- Azure CLI (for manual deployments) and appropriate permissions to storage and App Service

## Quick start (development)

1) Backend

- Restore and build:

```powershell
Push-Location backend
dotnet restore
dotnet build
Pop-Location
```

- Run (uses a file-backed SQLite DB by default in `Development`):

```powershell
Push-Location backend
dotnet run
Pop-Location
```

By default the app listens on `http://localhost:5000` and `https://localhost:5001`.

2) Frontend

- Install and run the Angular dev server:

```powershell
Push-Location frontend
npm ci
npm.cmd start
Pop-Location
```

Open `http://127.0.0.1:4200`.

### Note about API base (development)
- Local dev: the frontend will target `http://127.0.0.1:5000/api` by default when running the dev server.
- When the frontend is built for production and hosted as a static site (Azure Storage), the runtime API helper reads a meta tag `api-base-url` injected into `index.html` (or `window.__env.API_BASE`) so the app points at the backend host rather than the static content host.

## Deployment to Azure (CI pipeline)

The repository includes `azure-pipelines.yml` which performs build and optional deploy to Dev/UAT/Prod. Key behaviours:

- Frontend build uses Node 20.x and outputs artifacts that the pipeline uploads to the storage account `$web` container.
- During the Dev/UAT/Prod frontend deploy steps the pipeline:
  - Resolves the backend App Service default host name (e.g. `ai-poc-backend-dev.azurewebsites.net`).
  - Patches `frontend/dist/*/index.html` to set `<meta name="api-base-url" content="https://<backendHost>/api" />` so the SPA uses the backend API.
  - Uploads the `$web` blob container contents (overwrites existing blobs).
  - Sets `Cache-Control` on `index.html` to `no-cache, no-store, must-revalidate` and sets long-lived cache (`public, max-age=31536000, immutable`) on hashed assets like `main.*.js` and `styles.*.css`.

Required pipeline variables / secrets for deployment:

- `azureSubscription` — Azure service connection name used by AzureCLI/AzureWebApp tasks.
- `resourceGroupDev|Uat|Prod` — resource group names.
- `backendAppNameDev|Uat|Prod` — App Service names.
- `frontendStorageAccountDev|Uat|Prod` — Storage account names for static website hosting.
- `FRONTEND_STORAGE_CONNECTION_STRING_DEV|UAT|PROD` — *secret* connection string used by the upload step (preferred) or rely on AAD-auth (`--auth-mode login`).
- `FLEET_CONNECTION_STRING` — secret connection string for the target database; when present the pipeline will run EF Core migrations and set app settings to enable seeding (`ENABLE_SEEDING=true`) in the target App Service.

Deployment notes
- The pipeline will not run migrations unless `FLEET_CONNECTION_STRING` is supplied. This avoids accidentally modifying production-like databases.
- To enable seeding during deploy set the App Service app setting `ENABLE_SEEDING=true` (the pipeline sets this when uploading the backend in the Dev job by default in the provided configuration).

## Backend DB migrations and seeding

- Migrations: the pipeline includes an optional step to run `dotnet ef database update` using the `FLEET_CONNECTION_STRING` secret if provided.
- Seeding: the backend supports an `ENABLE_SEEDING` app setting; when `true` (or when the app is started in `Development` with no production DB) seed data will be applied. The recent change added example `ServiceAppointment` rows to make the UI show initial data in fresh environments.

## Frontend runtime API base injection (how it works)

- The production `index.html` contains a meta tag:

```html
<meta name="api-base-url" content="https://<backend-host>/api" />
```

- At runtime a small inline script sets `window.__env.API_BASE` from this meta BEFORE the Angular bundles load. The Angular services read `window.__env.API_BASE` (or the meta) via a small helper `frontend/src/app/runtime-api.ts` so API calls use the correct backend host.

Why this matters: when a SPA is hosted on Azure Storage static website, requests to `/api` without a fully-qualified backend host will be sent to the storage account origin and return `index.html` (not the API). Injecting the backend host prevents that origin mismatch.

## Troubleshooting (frontend not showing data after deploy)

- Hard refresh and cache purge: after a deploy, perform a hard refresh (Ctrl+F5) or clear site data to ensure the browser loads the newest `index.html` and JS bundles.
- Verify `index.html` meta: open the served `index.html` in the browser and confirm the `<meta name="api-base-url">` contains the expected backend host (https://<app>.azurewebsites.net/api).
- Console logs: developer builds include debug logging in `frontend/src/app/fleet.service.ts` to print the resolved `API_BASE` and outgoing GET request URLs. Check browser DevTools Console for:
  - "FleetService: resolved API_BASE = https://..."
  - "FleetService: GET https://.../api/ServiceAppointments"
- Confirm API responses: Network tab should show 200 responses for `/api/...` requests and JSON payloads returned from the backend. If the response body is HTML (the SPA `index.html`), the request is hitting the static site host instead of the API.
- List blobs in `$web`: if you suspect stale JS bundles co-exist with the updated `index.html`, list blobs in the storage `$web` container and confirm the `main.*.js` served matches the latest upload. You can use `az storage blob list` with the connection string or account name.
- Remove old hashed assets: if older `main.*.js` blobs remain, delete them once you've confirmed the latest bundle referenced by `index.html` is present.

Example commands (Azure CLI):

```bash
# List blobs (connection string path)
az storage blob list --connection-string "$FRONTEND_STORAGE_CONNECTION_STRING_DEV" --container-name '$web' --query "[].{name:name, lastModified:properties.lastModified}"

# Update cache-control for index.html (if needed)
az storage blob update --connection-string "$FRONTEND_STORAGE_CONNECTION_STRING_DEV" --container-name '$web' --name index.html --content-cache-control 'no-cache, no-store, must-revalidate'
```

## Testing & Playwright

- Playwright tests live under `frontend/tests`. Provide `FLEET_USERNAME` and `FLEET_PASSWORD` as environment variables or secrets when running tests.
 - Playwright tests live under `frontend/tests`. Provide `FLEET_USERNAME` and `FLEET_PASSWORD` as environment variables or secrets when running tests.
 - CI note: the pipeline includes an optional `E2E_Dev` stage controlled by the `runPlaywright` variable (default `false`). To run Playwright in Azure Pipelines set `runPlaywright=true` for the run; the stage resolves the deployed frontend URL, runs `npx playwright install --with-deps && npx playwright test`, and publishes the `playwright-report` artifact.

## Security and recommendations

- Use Azure Key Vault + Managed Identity for secrets in App Service and pipeline variable groups.
- Persist DataProtection keys to blob storage for multi-instance App Services (see `DataProtection:BlobContainerUri` config options).
- Host the frontend behind a CDN or Static Web Apps + CDN for improved performance and security; ensure runtime meta injection still occurs or move injection to an edge rule if needed.

## Contact / Support

- For deployment issues include pipeline logs, the `index.html` served content, and browser console logs so we can pinpoint whether the problem is a runtime API base mismatch, stale cached assets, or a backend issue.

---
*This README was updated to reflect recent changes to runtime API injection, pipeline cache-control headers, and DB seeding behavior.*
- `FORCE_HTTPS` is intended for local parity and debugging; do not skip certificate validation in tests or production.
