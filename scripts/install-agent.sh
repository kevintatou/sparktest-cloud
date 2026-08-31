#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${SPARKTEST_AGENT_REPO_URL:-https://github.com/kevintatou/sparktest-cloud.git}"
INSTALL_DIR="${SPARKTEST_AGENT_DIR:-$HOME/.sparktest-cloud-agent}"

SPARKTEST_CLOUD_URL="${SPARKTEST_CLOUD_URL:-https://sparktest-cloud-api.onrender.com}"
: "${SPARKTEST_AGENT_TOKEN:?Set SPARKTEST_AGENT_TOKEN before running this installer}"

if ! command -v git >/dev/null 2>&1; then
  printf 'Git is required to install the SparkTest agent.\n' >&2
  exit 1
fi

if ! command -v cargo >/dev/null 2>&1; then
  printf 'Rust and Cargo are required. Install them from https://rustup.rs/\n' >&2
  exit 1
fi

if [[ ! -d "$INSTALL_DIR/.git" ]]; then
  git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
else
  git -C "$INSTALL_DIR" pull --ff-only
fi

cd "$INSTALL_DIR"
exec env \
  SPARKTEST_CLOUD_URL="$SPARKTEST_CLOUD_URL" \
  SPARKTEST_AGENT_TOKEN="$SPARKTEST_AGENT_TOKEN" \
  SPARKTEST_AGENT_NAME="${SPARKTEST_AGENT_NAME:-$(hostname)-agent}" \
  cargo run -p sparktest-agent
