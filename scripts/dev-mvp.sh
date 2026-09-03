#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENT_DIR="${2:-/tmp/sparktest-cloud-anonymous}"
AGENT_TOKEN="${1:-${SPARKTEST_AGENT_TOKEN:-}}"
LOG_DIR="${SPARKTEST_LOG_DIR:-/tmp/sparktest-cloud}"
BACKEND_PORT="${SPARKTEST_BACKEND_PORT:-3001}"
FRONTEND_PORT="${SPARKTEST_FRONTEND_PORT:-3000}"

if [[ -n "$AGENT_TOKEN" && ! -d "$AGENT_DIR" ]]; then
  printf 'Agent directory does not exist: %s\n' "$AGENT_DIR" >&2
  exit 1
fi

mkdir -p "$LOG_DIR"

port_in_use() {
  (echo >/dev/tcp/127.0.0.1/"$1") >/dev/null 2>&1
}

if port_in_use "$FRONTEND_PORT"; then
  FRONTEND_PORT=3300
fi

if port_in_use "$FRONTEND_PORT"; then
  printf 'Frontend ports 3000 and 3300 are already in use. Set SPARKTEST_FRONTEND_PORT.\n' >&2
  exit 1
fi

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

declare -a PIDS=()

cleanup() {
  trap - INT TERM EXIT
  printf '\nStopping SparkTest MVP services...\n'
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

printf 'Logs: %s\n' "$LOG_DIR"
printf 'Frontend: http://localhost:%s\n' "$FRONTEND_PORT"
printf 'Backend:  http://localhost:%s\n' "$BACKEND_PORT"

(
  cd "$ROOT_DIR"
  PORT="$BACKEND_PORT" cargo run -p sparktest-saas-bin
) >"$LOG_DIR/backend.log" 2>&1 &
PIDS+=("$!")

printf 'Waiting for backend...\n'
for _ in {1..60}; do
  if curl --silent --fail "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "${PIDS[0]}" 2>/dev/null; then
    break
  fi
  sleep 1
done

if ! curl --silent --fail "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
  printf 'Backend did not become ready. Check %s/backend.log\n' "$LOG_DIR" >&2
  exit 1
fi

(
  cd "$ROOT_DIR"
  NEXT_PUBLIC_API_URL="http://localhost:$BACKEND_PORT" \
    PORT="$FRONTEND_PORT" pnpm dev:frontend
) >"$LOG_DIR/frontend.log" 2>&1 &
PIDS+=("$!")

if [[ -n "$AGENT_TOKEN" ]]; then
  (
    cd "$AGENT_DIR"
    SPARKTEST_CLOUD_URL="http://localhost:$BACKEND_PORT" \
      SPARKTEST_AGENT_TOKEN="$AGENT_TOKEN" \
      SPARKTEST_AGENT_NAME="${SPARKTEST_AGENT_NAME:-anonymous-clone-agent}" \
      cargo run -p sparktest-agent
  ) >"$LOG_DIR/agent.log" 2>&1 &
  PIDS+=("$!")
  printf 'Agent:    enabled (%s)\n' "$AGENT_DIR"
else
  printf 'Agent:    disabled\n'
fi

printf 'Backend, frontend, and agent started. Press Ctrl+C to stop all three.\n'
printf 'Watch logs with: tail -f %s/*.log\n' "$LOG_DIR"

wait -n "${PIDS[@]}"
status=$?
printf 'A service exited with status %s. Check %s/*.log\n' "$status" "$LOG_DIR"
exit "$status"
