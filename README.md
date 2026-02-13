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

- Local development fallback (default):
	- If no SQL connection is provided and the environment is `Development`, the backend uses a file-backed SQLite DB (`fleet.db`) located in the backend working directory. This keeps local data persistent across restarts without requiring SQL Server.

API endpoints

- `GET /api/AssetTypes` — list asset types
- `GET /api/ServiceCenters` — list service centers
- `GET /api/ServiceAppointments` — list appointments
- `POST /api/ServiceAppointments` — create appointment

Frontend integration

- The Angular app calls the API at `http://127.0.0.1:5000/api` by default. If you change backend ports or host, update `frontend/src/app/fleet.service.ts` `API_BASE` constant.

Common issues & troubleshooting

- PowerShell blocks `npm` scripts (`npm.ps1`): run `npm.cmd start` instead of `npm start`, or adjust PowerShell execution policy if you prefer (not recommended on shared machines).

- File lock on build (`apphost.exe` / `FleetManagement.exe`): stop running instances before building. Example to stop dotnet processes:

```
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
```

- SQL Server connection problems: if you point to an existing SQL Server instance and the backend fails to start while attempting to connect, verify the instance is running, that the connection string is correct, and that the current user has permission to connect. You can also test connectivity using `sqlcmd` or SSMS.

- Appointments missing after restart: if backend uses the in-memory provider, data does not persist. Use the SQLite fallback or configure a SQL Server connection string to persist data.

Development notes

- `Program.cs` prefers an explicitly configured SQL connection (`FleetDatabase`/`FLEET_CONNECTION_STRING`). If present, DB seeding/migrations at startup are skipped to avoid modifying production-like databases.
- For local development, the app uses SQLite (`fleet.db`) so you can create appointments and keep them between runs.

How to switch to your SQL Server instance for dev/testing

1. Ensure the SQL Server instance is running and reachable from your machine.
2. Export or provide the connection string and set `FLEET_CONNECTION_STRING` before running the backend (PowerShell example shown above).
3. Restart the backend. The app will connect to your SQL Server and use existing data (it will not run migrations automatically).

Testing

- Manual testing: use the frontend to create appointments via the homepage. The appointments page will list created appointments. You can also call the API directly:

```
Invoke-RestMethod -Uri http://127.0.0.1:5000/api/ServiceAppointments
```

- End-to-end tests (Playwright)

	This project includes Playwright E2E tests under `frontend/tests`.

	1) Provide credentials for tests

		 - Copy `.env.example` to `.env` and set `FLEET_USERNAME` and `FLEET_PASSWORD` (do NOT commit `.env`).
		 - Alternatively set environment variables in your shell or in CI (`FLEET_USERNAME`, `FLEET_PASSWORD`).

	2) Run the tests locally (PowerShell example that avoids execution-policy issues):

```powershell
# Set test credentials in environment variables (do NOT commit these).
# Replace the placeholders with your secure test credentials or load from a local `.env` file.
$env:FLEET_USERNAME='your_username'; $env:FLEET_PASSWORD='your_password'; Push-Location 'C:\dev\ai-poc-tranzaura\frontend'; cmd /c "npm run e2e:pdf"; Pop-Location
```

	- You can omit the inline env settings if you created a local `.env` and load it using your preferred dotenv loader, or set the vars in your CI environment.
	- If PowerShell blocks running `npm` scripts on your machine, the `cmd /c` wrapper above avoids the `npm.ps1` execution policy issue.

	3) CI / GitHub Actions

		 - Add `FLEET_USERNAME` and `FLEET_PASSWORD` as repository secrets and expose them to the workflow step that runs Playwright. Example snippet:

```yaml
- name: Run Playwright tests
	env:
		FLEET_USERNAME: ${{ secrets.FLEET_USERNAME }}
		FLEET_PASSWORD: ${{ secrets.FLEET_PASSWORD }}
	run: npx playwright test
```

	Notes
	- Tests are written to use the existing seeded admin user by default; they will not attempt to create new admin users.
	- If your backend is running on a different host/port, set `FLEET_API_URL` or update the test helper functions accordingly.

Contributing

- Follow repository coding conventions. Make small, focused changes and open PRs against `main`.

Contact / Support

- If you hit environment-specific issues (SQL instance errors, local dev certs), include the error logs and I can help diagnose and fix the startup sequence.

License

- This repository is for demonstration purposes; add your preferred license if you intend to publish or reuse the code.

# Security precautions (applied)

- **HTTPS / HSTS enforced in production**: the backend enables HTTPS redirection and HSTS when running in a Production environment.
- **Restricted CORS**: a production CORS policy is configured. Set the `FRONTEND_ORIGIN` environment variable (or `FrontendOrigin` configuration) to the exact frontend origin to allow cross-origin requests in production.
- **Security headers**: a middleware adds conservative security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Consider moving CSP management to your CDN/edge for finer control.
- **Safe error handling**: unhandled exceptions return a generic error message; detailed exception data is logged only to the app's telemetry/log store.
- **Recommendations (not yet automated)**: use Azure Key Vault + Managed Identity for secrets, persist DataProtection keys to blob/KeyVault for multi-instance scenarios, run `dotnet list package --vulnerable` and `npm audit`, and host the frontend behind a CDN or Azure Static Web Apps with a WAF in front of the API (Front Door/Application Gateway + WAF).

# ai-poc-tranzaura

## Local HTTPS / FORCE_HTTPS

- Purpose: enable HTTPS redirection and HSTS in non-production to replicate production TLS behaviour locally for testing and E2E parity.
- How it works: the backend reads `ForceHttps` configuration or the environment variable `FORCE_HTTPS`. When set to `true`, the app applies HSTS and `UseHttpsRedirection()` even when `ASPNETCORE_ENVIRONMENT` is not `Production`.

Examples (PowerShell):

1) Trust the .NET developer certificate (required once):

```powershell
dotnet dev-certs https --trust
```

2) Run the backend with `FORCE_HTTPS` enabled:

```powershell
$env:FORCE_HTTPS = 'true'
Push-Location backend
dotnet run
Pop-Location
```

3) Optionally ensure ASP.NET Core binds HTTPS on the expected port (default `5001`):

```powershell
$env:ASPNETCORE_URLS = 'https://localhost:5001;http://localhost:5000'
dotnet run --project backend
```

CI trigger: small README update to start Azure Pipelines build.

Notes:
- Use `FORCE_HTTPS` locally only when you have a trusted dev certificate installed (see step 1). For CI or shared runners, prefer issuing real certificates or running tests against a test environment that already exposes HTTPS.
- `FORCE_HTTPS` is intended for local parity and debugging; do not skip certificate validation in tests or production.
- If you run Playwright or other E2E tests against HTTPS, ensure tests point to the `https://` API URL or set any test-specific `FLEET_API_URL`/environment variables your test harness supports.

## Infrastructure & CI

- This repository includes a parameterized Bicep template and per-environment parameter files under `infra/` for provisioning Azure resources. See [infra/README.md](infra/README.md) for detailed instructions.
- The CI pipeline (`[azure-pipelines.yml](azure-pipelines.yml)`) now deploys infra per environment using `infra/main.bicep` plus `infra/dev.parameters.json`, `infra/uat.parameters.json`, and `infra/prod.parameters.json`.
- Deployments are targeted to separate resource groups (`resourceGroupDev`, `resourceGroupUat`, `resourceGroupProd`) to keep Dev/UAT/Prod resources isolated.
- The pipeline runs an Azure CLI `what-if` preview before applying infra changes; destructive changes (Delete or Replace) will block the Prod deployment.
- Pipeline variable names for environment-specific services: `backendAppNameDev|Uat|Prod`, `frontendStorageAccountDev|Uat|Prod`, and similarly for storage/app-service plan names. See the variables block in [azure-pipelines.yml](azure-pipelines.yml) for exact names.
- The pipeline will run EF Core migrations only when a `FLEET_CONNECTION_STRING` secret is provided to the pipeline (see pipeline notes). Default behavior is to skip migrations when no connection string is supplied.


## DataProtection keys (Azure Blob Storage)

For multi-instance deployments you should persist ASP.NET Core DataProtection keys to a central store. This project supports persisting keys to Azure Blob Storage when configured; otherwise it falls back to a local filesystem path.

Environment/configuration options (examples):

- `DataProtection:BlobContainerUri` — full container URI (e.g. `https://<account>.blob.core.windows.net/<container>`). When present the app will use `DefaultAzureCredential` (Managed Identity) to access the container.
- `DataProtection:BlobStorage:ConnectionString` and `DataProtection:BlobStorage:ContainerName` — alternative using a storage connection string.
- `DataProtectionPath` — local filesystem fallback path for development.

Example (App Service with managed identity):

1. Create an Azure Storage container (e.g., `dataprotection`).
2. Assign the App Service a system-assigned Managed Identity and grant it `Storage Blob Data Contributor` role scoped to the container.
3. Set `DataProtection:BlobContainerUri` to the container URI in App Settings.

Local development (no blob storage): set `ASPNETCORE_ENVIRONMENT=Development` or leave blob settings empty; keys will be stored on disk under the application data folder by default.
