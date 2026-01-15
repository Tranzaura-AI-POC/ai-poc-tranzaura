# Alerts & Monitoring — Recommendations

This document lists recommended Application Insights/monitoring alert rules and example Azure CLI commands to create action groups and alerts. Replace placeholders with your subscription, resource group, and resource names.

## 1) Action Group (notification channel)
Create an Action Group to forward alerts to email, Teams, PagerDuty, or Webhook.

Example (email + webhook):

```bash
az monitor action-group create \
  --resource-group <rg> \
  --name app-alerts-ag \
  --short-name appag \
  --receiver email emailReceiverName <you@company.com> \
  --receiver webhook webhookReceiverName https://hooks.example.com/alerts
```

Save the action group resource id for alert creation:

```bash
az monitor action-group show -g <rg> -n app-alerts-ag --query id -o tsv
```

## 2) Application Insights alerts
Target: backend App Service (or App Insights resource). Use App Insights metric or log-based alerts.

- High server error rate (5xx)
  - Type: Log (Analytics) alert
  - Query (Application Insights):

```kusto
requests
| where timestamp > ago(5m)
| summarize errors = countif(success == false and resultCode startswith "5"), total = count() 
| extend errorRate = todouble(errors) / todouble(total)
| where total >= 10 and errorRate > 0.05
```

- High request duration (p95) — alert when p95 response time > 2s
  - Type: Metric or Log alert
  - Metric: `requests/Duration` P95 aggregation

- Elevated exception count
  - Type: Metric or Log, when `exceptions` count in 5m > threshold (e.g., 5)

Example: create a log alert rule (requires `--scopes` to point to the Application Insights resource):

```bash
az monitor scheduled-query create \
  --resource-group <rg> \
  --name "High-5xx-Rate" \
  --scopes /subscriptions/<sub>/resourceGroups/<rg>/providers/microsoft.insights/components/<app-insights-name> \
  --condition "requests | where timestamp > ago(5m) | summarize errors = countif(success == false and resultCode startswith '5'), total = count() | extend errorRate = todouble(errors)/todouble(total) | where total >= 10 and errorRate > 0.05" \
  --description "Alert when 5xx error rate exceeds 5% in last 5 minutes" \
  --window-size PT5M --evaluation-frequency PT1M \
  --action /subscriptions/<sub>/resourceGroups/<rg>/providers/microsoft.insights/actionGroups/app-alerts-ag
```

## 3) Platform metrics alerts (App Service / Container / SQL)

- Backend App Service CPU high
  - Metric: `Percentage CPU`
  - Alert: avg `Percentage CPU` > 75% over 5 minutes

- SQL DB DTU / vCore / CPU / Deadlocks
  - Metric: `cpu_percent` or `dtu_consumption_percent` (or appropriate vCore metrics)
  - Alert: avg CPU > 80% over 5 minutes OR DTU% > 85%

- Storage/Blob ingress errors
  - Metric: `Availability` / `Success E2E` (adjust per resource)

Example: App Service CPU alert

```bash
az monitor metrics alert create \
  --name "AppService_High_CPU" \
  --resource-group <rg> \
  --scopes /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Web/sites/<app-service-name> \
  --condition "avg Percentage CPU > 75" --description "App Service CPU high" \
  --window-size PT5M --evaluation-frequency PT1M \
  --action /subscriptions/<sub>/resourceGroups/<rg>/providers/microsoft.insights/actionGroups/app-alerts-ag
```

Example: SQL CPU alert

```bash
az monitor metrics alert create \
  --name "Sql_High_CPU" \
  --resource-group <rg> \
  --scopes /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Sql/servers/<sql-server>/databases/<db-name> \
  --condition "avg cpu_percent > 80" --window-size PT5M --evaluation-frequency PT1M \
  --action /subscriptions/<sub>/resourceGroups/<rg>/providers/microsoft.insights/actionGroups/app-alerts-ag
```

## 4) Failed deploys / CI pipeline alerts

- Azure DevOps: configure Service Hooks or pipeline notifications to the Action Group webhook or create a pipeline step that calls the Alert REST API when a release fails.
- GitHub Actions: use a step on failure to call an incoming webhook or Azure Monitor REST API.

Example (Azure DevOps service hook to webhook):
1. In Project Settings → Service hooks → Create subscription → choose Web Hooks → set the webhook URL to the Action Group or other receiver.

## 5) Alert tuning and runbooks

- Start with conservative thresholds and iterate after observing baseline traffic.
- Create runbooks for common alerts:
  - `High-5xx-Rate` → check app logs, recent deploys, rollback if deploy in last X minutes.
  - `High-CPU` → scale out plan, health check, restart slot.
  - `DB High CPU/DTU` → check long-running queries, add read replicas, or scale compute.

## 6) Dashboard and SLOs

- Create an Application Insights dashboard with these widgets: requests per minute, failed requests, p95 duration, exceptions, CPU, DB CPU/DTU.
- Define SLOs (availability, p95) and map alerts to SLO breaches.

---

If you want, I can create ARM/Bicep snippets to provision the Action Group and a couple of sample metric alerts, or add an Azure DevOps pipeline step that posts to the Action Group on failures. Which would you prefer next?
