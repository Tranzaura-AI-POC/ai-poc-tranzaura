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

- Use the frontend to create appointments via the homepage. The appointments page will list created appointments. You can also call the API directly:

```
Invoke-RestMethod -Uri http://127.0.0.1:5000/api/ServiceAppointments
```

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