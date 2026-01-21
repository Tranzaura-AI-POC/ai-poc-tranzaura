
# Infra: deploying the Bicep template

This folder contains a single parameterized Bicep template `main.bicep` plus per-environment parameter files.

Files
- `main.bicep` — parameterized template (required `environment` param).
- `dev.parameters.json`, `uat.parameters.json`, `prod.parameters.json` — environment-specific parameter values.

Quick deploy (local / CI)

1. Validate / What-If (recommended):

```bash
az deployment group what-if \
  --resource-group <your-rg> \
  --template-file infra/main.bicep \
  --parameters @infra/dev.parameters.json
```

2. Apply deployment:

```bash
az deployment group create \
  --resource-group <your-rg> \
  --template-file infra/main.bicep \
  --parameters @infra/dev.parameters.json
```

Notes
- To override a value from the parameter file, append `--parameters name=value` to the command.
- The pipeline uses these parameter files (see `azure-pipelines.yml`) — recommended for repeatable CI deployments.
- Every resource created by the template is tagged via the `resourceTags` parameter; update the parameter files to set `project`, `owner`, and `environment` as required.
- If an environment requires different resources, keep the shared `main.bicep` and consider using Bicep modules or a small env-specific wrapper.

Troubleshooting
- If deployment fails with a validation error, run `az deployment group what-if` to inspect changes first.
- For naming collisions (storage/web app names must be globally unique where applicable), update the parameter values to unique names.

Contact
- If you want, I can add a `what-if` stage to the pipeline or convert parameters to secure variable groups.
