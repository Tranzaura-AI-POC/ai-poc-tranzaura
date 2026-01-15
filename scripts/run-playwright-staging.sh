#!/usr/bin/env bash
set -euo pipefail

# Usage: RUN_PLAYWRIGHT_BASE_URL="https://staging.example.com" ./scripts/run-playwright-staging.sh
BASE_URL=${PLAYWRIGHT_BASE_URL:-${RUN_PLAYWRIGHT_BASE_URL:-}}
if [ -z "$BASE_URL" ]; then
  echo "PLAYWRIGHT_BASE_URL not set. Set PLAYWRIGHT_BASE_URL or RUN_PLAYWRIGHT_BASE_URL to the staging frontend URL." >&2
  exit 1
fi

echo "Running Playwright e2e against $BASE_URL"
pushd frontend > /dev/null
export PLAYWRIGHT_BASE_URL="$BASE_URL"
npm ci
npx playwright test --reporter=html
# Save report artifact to pipeline workspace if present
if [ -d playwright-report ]; then
  mkdir -p ../Test\ Results || true
  cp -r playwright-report ../"Test Results" || true
fi
popd > /dev/null

echo "Playwright run complete."
