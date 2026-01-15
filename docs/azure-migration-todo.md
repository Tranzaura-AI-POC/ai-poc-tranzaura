
---

## Recent changes (completed)

- Azure Pipelines YAML scaffolded: `azure-pipelines.yml` at repository root (Build → Deploy-Dev → Deploy-UAT → Deploy-Prod with manual prod approval).
- Dockerfiles added: `backend/Dockerfile` and `frontend/Dockerfile` for local image builds and ACR publishing.
- Config examples added: `backend/appsettings.Production.json.example`, `frontend/.env.example`, and `docs/production-config.md`.
- Data seeding gated: `backend/Data/SeedData.cs` only seeds in Development/CI or when `ENABLE_SEEDING=true`.
- EF Core helper script: `scripts/db-migrate.sh` added to run migrations from CI or locally.
- Health endpoints added: `backend/Controllers/HealthController.cs` exposes `/healthz` and `/readyz`.
- DataProtection persistence implemented: `Program.cs` now supports `DataProtection:BlobContainerUri` (Managed Identity) or `DataProtection:BlobStorage:ConnectionString` + `ContainerName`; falls back to filesystem.
- Key Vault config provider wiring present (optional based on `KeyVault:Uri`).
- README updated with DataProtection guidance.
- Bicep template added: `infra/storage-dataprotection.bicep` to provision Storage Account, container and role assignment for DataProtection keys.

## Files added (quick reference)

- `azure-pipelines.yml` — CI/CD scaffold
- `backend/Dockerfile`, `frontend/Dockerfile` — container builds
- `backend/appsettings.Production.json.example`, `frontend/.env.example` — config examples
- `docs/production-config.md` — production configuration notes
- `scripts/db-migrate.sh` — migration helper
- `backend/Controllers/HealthController.cs` — health/readiness endpoints
- `infra/storage-dataprotection.bicep` — storage + role assignment template

## Recommended next tasks

- Wire Application Insights (opt-in) in `Program.cs` and add `APPINSIGHTS_CONNECTIONSTRING` sample to config examples.
- Add a Playwright smoke-test job to the pipeline that runs against staging after deployment (use client-only JWT to avoid DB writes).
- Finalize IaC (Bicep/Terraform) for SQL, App Services/Container Apps, Key Vault, and ACR as needed.
# Azure Migration — Todo List

Last updated: 2026-01-15

This document captures the prioritized steps to move `ai-poc-tranzaura` to your Azure organization. Treat each top-level checkbox as a milestone; expand items into sub-tasks as needed.

- [ ] Prepare Azure account and access
  - Create or confirm Resource Group and Subscription.
  - Create a service principal with scoped rights (least privilege) for CI/CD.
  - Create an Azure DevOps service connection or GitHub service principal.

- [ ] Choose deployment targets
  - Decide between App Service (PaaS) for .NET or container-based (Azure Container Apps / AKS).
  - Document reasons: scaling, cost, operational overhead, and CI/CD implications.

- [ ] Provision infrastructure (IaC)
  - Author Bicep or Terraform templates to create: Resource Group, Azure SQL Server + Database (or Managed Instance), App Service / Container Apps / ACR, Key Vault, Storage Account (for DataProtection keys), Application Insights, and optional VNet/subnet.
  - Keep all templates parameterized for `env` (staging/prod).

- [ ] Secure secrets with Key Vault and Managed Identity
  - Enable system-assigned Managed Identity on App Service / Container instance.
  - Store DB connection string, `FRONTEND_ORIGIN`, `LocalJwt` key (dev-only), and any third-party secrets in Key Vault.
  - Grant Key Vault access (Key Vault access policy or RBAC) to the Managed Identity.
  - Enable Key Vault soft-delete and purge protection.

- [ ] Authentication & Authorization setup
  - Register backend and frontend apps in Azure AD (App registrations).
  - Configure OAuth redirect URIs for the frontend, and expose API scopes for the backend.
  - Replace dev `LocalJwt` fallback with Azure AD in production; update `Program.cs` to validate Azure AD JWTs (Authority/Audience).
  - Plan user/role mapping (groups or roles claims) for `Authorize` attributes.

- [ ] Update application to use Azure services
  - Change configuration to read connection strings and secrets from environment variables and Key Vault.
  - Configure DataProtection to persist keys to Azure Blob Storage or Key Vault.
  - Use Managed Identity to access Key Vault (avoid embedding secrets).
  - Ensure startup reads `FRONTEND_ORIGIN` from Key Vault/Config and does not enable broad CORS in production.

- [ ] Database migration and seeding policy
  - Decide EF Core migration strategy: run migrations as part of deployment (pipeline job) or via a separate admin job.
  - Ensure seeding only runs in Development/CI and never creates test/registration users in production.
  - Create a safe rollback plan for schema changes.

- [ ] CORS, HTTPS, and security headers
  - Set `FRONTEND_ORIGIN` to the production frontend URL only.
  - Enforce HTTPS and HSTS in production.
  - Tighten CORS to specific origins and methods; remove permissive dev fallbacks for production.
  - Keep security headers middleware (`SecurityHeadersMiddleware`) enabled and reviewed.

- [ ] CI/CD pipeline (Azure Pipelines or GitHub Actions)
  - Pipeline should: build backend and frontend, run unit/tests, build Docker image (if using containers), push to ACR, deploy to App Service/Container Apps, run DB migrations, and run post-deploy smoke tests.
  - Use a service principal with least privilege; store pipeline secrets in Key Vault or secure pipeline variable groups.
  - Add required approvals for production and protect the `main` branch.

- [ ] Monitoring, logging and alerts
  - Enable Application Insights for backend and frontend.
  - Configure alerts for failed deployments, high error rate, high CPU/RU, and DB issues.
  - Centralize logs and enable diagnostic logging for Key Vault and other critical resources.

- [ ] Network and data protection
  - Consider Private Link or VNet integration for Azure SQL to prevent public exposure.
  - Configure firewall rules for SQL and storage accounts.
  - Ensure Transparent Data Encryption (TDE) and encryption at rest for all storage.

- [ ] Access control and operational security
  - Use Azure RBAC to limit human and service access to resources.
  - Rotate service principal credentials and Key Vault secrets regularly.
  - Enable activity logs and export them to a Log Analytics workspace.
  - Create runbooks for common operational tasks and incident response.

- [ ] Cost, sizing and testing
  - Estimate costs and choose SKUs for App Service/VM/AKS, SQL, and other resources.
  - Run performance and load tests in a staging environment.
  - Validate autoscale settings and failover.

- [ ] Documentation and runbook
  - Document deployment steps, pipeline variables, required environment variables, secret names in Key Vault, and how to rotate credentials.
  - Include development vs production config differences and local run steps.

- [ ] Staging environment and final cutover
  - Provision a staging environment mirroring production.
  - Run full e2e tests and smoke tests (Playwright) in staging.
  - Plan DNS cutover, certificate provisioning, and a maintenance window for production deployment.

---

## Security & Authentication Checklist (quick reference)

- Use Key Vault and Managed Identity — no plaintext secrets in repos.
- Register apps in Azure AD and use AAD tokens in production (no `LocalJwt` fallback in prod).
- Persist DataProtection keys to Azure Blob Storage or Key Vault.
- Tighten CORS and enforce HTTPS/HSTS in production.
- Protect databases with Private Link or VNet and enable firewall rules.
- Enable Key Vault soft-delete, logging, and rotation policies.
- Limit service principal scopes and use RBAC for human access.

---

## Quick links & notes

- App config/code locations to review before deployment:
  - `backend/Program.cs` — CORS, auth & startup configuration
  - `backend/Data/SeedData.cs` — seeding behavior (ensure gated)
  - `frontend/proxy.conf.json` — dev proxy; not used in production
  - `frontend/scripts/generate-test-pdf.js` — CI artifact generation (if needed)


---

If you want, I can now scaffold an Azure Pipelines YAML to build and deploy this app (staging and production), or draft GitHub Actions instead. Which CI system should I target?