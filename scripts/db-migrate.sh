#!/usr/bin/env bash
set -euo pipefail

echo "Running EF Core migrations..."
pushd backend > /dev/null
dotnet tool restore || true
dotnet ef database update --project FleetManagement.csproj
popd > /dev/null
echo "Migrations complete."
