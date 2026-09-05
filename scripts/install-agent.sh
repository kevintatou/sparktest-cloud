#!/usr/bin/env bash
set -euo pipefail

REPO="${SPARKTEST_AGENT_REPO:-kevintatou/sparktest-cloud}"
VERSION="${SPARKTEST_AGENT_VERSION:-latest}"
INSTALL_DIR="${SPARKTEST_AGENT_INSTALL_DIR:-$HOME/.local/bin}"

command -v curl >/dev/null || { printf 'curl is required.\n' >&2; exit 1; }
command -v tar >/dev/null || { printf 'tar is required.\n' >&2; exit 1; }

os="$(uname -s)"
arch="$(uname -m)"
case "$os:$arch" in
  Linux:x86_64) target="x86_64-unknown-linux-gnu" ;;
  Darwin:arm64) target="aarch64-apple-darwin" ;;
  *) printf 'No installer binary is published for %s %s. This installer supports Linux x86_64 and Apple Silicon macOS.\n' "$os" "$arch" >&2; exit 1 ;;
esac

if [[ "$VERSION" == "latest" ]]; then
  VERSION="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | sed -n 's/.*"tag_name": "agent-v\([^"]*\)".*/\1/p' | head -1)"
  [[ -n "$VERSION" ]] || { printf 'Could not determine latest agent release.\n' >&2; exit 1; }
fi

artifact="sparktest-agent-v${VERSION}-${target}.tar.gz"
download_url="https://github.com/$REPO/releases/download/agent-v${VERSION}/${artifact}"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

curl -fsSL "$download_url" -o "$tmp_dir/$artifact"
tar -xzf "$tmp_dir/$artifact" -C "$tmp_dir"
mkdir -p "$INSTALL_DIR"
install -m 0755 "$tmp_dir/sparktest-agent" "$INSTALL_DIR/sparktest-agent"

printf 'Installed sparktest-agent %s to %s\n' "$VERSION" "$INSTALL_DIR/sparktest-agent"
if [[ -n "${SPARKTEST_AGENT_TOKEN:-}" ]]; then
  args=(connect "$SPARKTEST_AGENT_TOKEN")
  [[ -n "${SPARKTEST_CLOUD_URL:-}" ]] && args+=(--url "$SPARKTEST_CLOUD_URL")
  [[ -n "${SPARKTEST_AGENT_NAME:-}" ]] && args+=(--name "$SPARKTEST_AGENT_NAME")
  "$INSTALL_DIR/sparktest-agent" "${args[@]}"
else
  printf 'Connect it with: sparktest-agent connect <token>\n'
fi

case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *) printf 'For future terminals, add this directory to your PATH: %s\n' "$INSTALL_DIR" ;;
esac
printf 'Start the agent now: %q run\n' "$INSTALL_DIR/sparktest-agent"
