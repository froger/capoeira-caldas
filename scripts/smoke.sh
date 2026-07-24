#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE_PATH="${BASE_PATH:-/}"
case "$BASE_PATH" in
  "") BASE_PATH="/" ;;
  /*) ;;
  *) BASE_PATH="/${BASE_PATH}" ;;
esac
if [[ "$BASE_PATH" != "/" && "$BASE_PATH" != */ ]]; then
  BASE_PATH="${BASE_PATH}/"
fi
BASE_PREFIX="${BASE_PATH%/}" # "" for root, "/capoeira-caldas" otherwise

if [[ ! -f dist/index.html ]]; then
  echo "ERROR: dist/index.html missing — run npm run build first"
  exit 1
fi

grep -q 'Capoeira nas Caldas da Rainha' dist/index.html || {
  echo "ERROR: PT hero headline not found in dist/index.html"
  exit 1
}

grep -q 'lang="pt' dist/index.html || {
  echo "ERROR: lang=pt not found on home page"
  exit 1
}

if [[ -n "$BASE_PREFIX" ]]; then
  grep -q "${BASE_PREFIX}/_astro/" dist/index.html || {
    echo "ERROR: Astro assets missing ${BASE_PREFIX}/ base prefix (BASE_PATH=${BASE_PATH})"
    exit 1
  }
  grep -q "href=\"${BASE_PREFIX}/" dist/index.html || {
    echo "ERROR: internal links missing ${BASE_PREFIX}/ base prefix"
    exit 1
  }
  if grep -qE '(href|src)="/(_astro|images|fonts|video|favicon)' dist/index.html; then
    echo "ERROR: found root-absolute asset URLs without base (would 404 on GitHub Pages)"
    grep -oE '(href|src)="/(_astro|images|fonts|video|favicon)[^"]*"' dist/index.html | head -10
    exit 1
  fi
else
  grep -qE 'href="/_astro/' dist/index.html || {
    echo "ERROR: Astro CSS link not found at site root"
    exit 1
  }
fi

if [[ ! -f dist/en/index.html ]]; then
  echo "ERROR: dist/en/index.html missing"
  exit 1
fi

grep -q 'lang="en' dist/en/index.html || {
  echo "ERROR: lang=en not found on EN home page"
  exit 1
}

grep -q 'Capoeira in Caldas da Rainha' dist/en/index.html || {
  echo "ERROR: EN hero headline not found in dist/en/index.html"
  exit 1
}

if [[ ! -f dist/en/contact/index.html ]] && [[ ! -f dist/en/contact.html ]]; then
  echo "ERROR: EN contact page missing"
  exit 1
fi

echo "OK: smoke tests passed (BASE_PATH=${BASE_PATH})"
