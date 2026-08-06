#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  while IFS='=' read -r key value; do
    if [[ -z "$key" || "$key" == \#* || -n "${!key+x}" ]]; then
      continue
    fi
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    export "$key=$value"
  done < .env
fi

FRONTEND_PORT="${PLAYWRIGHT_DEV_PORT:-3300}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://sparktest-cloud-api.onrender.com}"
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" PORT="$FRONTEND_PORT" pnpm --filter '@tatou/sparktest-saas-frontend' exec next dev -p "$FRONTEND_PORT"
