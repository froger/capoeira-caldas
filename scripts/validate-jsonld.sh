#!/usr/bin/env bash
# Validate rendered JSON-LD with structured-data-testing-tool Google preset.
# Requires: yarn build (dist/ present).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f dist/index.html ]]; then
  echo "ERROR: dist/index.html missing — run yarn build first"
  exit 1
fi

SDTT=(npx --yes structured-data-testing-tool@4.5.0)

PAGES=(
  dist/index.html
  dist/en/index.html
  dist/aulas/index.html
  dist/contato/index.html
  dist/sobre/index.html
  dist/calendario/workshop-mestre-marcelo-2025/index.html
)

failed=0
for page in "${PAGES[@]}"; do
  if [[ ! -f "$page" ]]; then
    echo "ERROR: missing $page"
    failed=1
    continue
  fi
  echo "=== $page ==="
  if ! "${SDTT[@]}" --file "$page" --presets Google; then
    echo "FAIL: $page"
    failed=1
  fi
  echo
done

if [[ "$failed" -ne 0 ]]; then
  echo "validate-jsonld: failures detected"
  exit 1
fi

echo "OK: validate-jsonld passed (Google preset)"
