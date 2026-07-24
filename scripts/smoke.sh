#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f dist/index.html ]]; then
  echo "ERROR: dist/index.html missing — run npm run build first"
  exit 1
fi

grep -q 'A Arte que Conecta Corpos e Almas\|The Art that Connects Bodies and Souls' dist/index.html || {
  echo "ERROR: PT hero headline not found in dist/index.html"
  exit 1
}

grep -q 'lang="pt"' dist/index.html || {
  echo "ERROR: lang=pt not found on home page"
  exit 1
}

if [[ ! -f dist/en/index.html ]]; then
  echo "ERROR: dist/en/index.html missing"
  exit 1
fi

grep -q 'lang="en"' dist/en/index.html || {
  echo "ERROR: lang=en not found on EN home page"
  exit 1
}

if [[ ! -f dist/en/contact/index.html ]] && [[ ! -f dist/en/contact.html ]]; then
  # Astro may output en/contact/index.html
  if [[ ! -f dist/en/contact/index.html ]]; then
    echo "ERROR: EN contact page missing"
    exit 1
  fi
fi

echo "OK: smoke tests passed"
