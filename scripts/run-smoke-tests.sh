#!/usr/bin/env bash
set -euo pipefail

API_BASE=${API_BASE_URL:-${1:-}}
if [ -z "$API_BASE" ]; then
  echo "API_BASE_URL not set. Usage: API_BASE_URL=https://api.staging.example.com ./scripts/run-smoke-tests.sh" >&2
  exit 1
fi

echo "Running smoke tests against $API_BASE"

echo "Checking /healthz"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/healthz")
if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "/healthz returned $HTTP_STATUS" >&2
  exit 2
fi

echo "Checking sample API endpoints"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/ServiceCenters")
if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "/api/ServiceCenters returned $HTTP_STATUS" >&2
  exit 3
fi

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/ServiceAppointments")
if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "/api/ServiceAppointments returned $HTTP_STATUS" >&2
  exit 4
fi

echo "Smoke tests passed." 
