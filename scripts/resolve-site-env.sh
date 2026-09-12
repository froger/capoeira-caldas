#!/usr/bin/env bash
# Resolve SITE + BASE_PATH for builds. Prints KEY=value lines for GITHUB_ENV / dotenv.
# Priority: explicit env → GitHub Actions inputs/vars (passed in) → public/CNAME → OWNER/REPO.
set -euo pipefail

OWNER="${OWNER:-local}"
REPO="${REPO:-capoeira}"

cname_host() {
  local f="${1:-public/CNAME}"
  [[ -f "$f" ]] || return 1
  local host
  host="$(tr -d '[:space:]' < "$f")"
  [[ -n "$host" ]] || return 1
  [[ "$host" == *example.org ]] && return 1
  printf '%s' "$host"
}

DEFAULT_SITE="https://${OWNER}.github.io"
DEFAULT_BASE="/${REPO}/"
if HOST="$(cname_host)"; then
  DEFAULT_SITE="https://${HOST}"
  DEFAULT_BASE="/"
fi

SITE="${INPUT_SITE:-${VAR_SITE:-${SITE:-$DEFAULT_SITE}}}"
BASE_PATH="${INPUT_BASE_PATH:-${VAR_BASE_PATH:-${BASE_PATH:-$DEFAULT_BASE}}}"

case "$BASE_PATH" in
  "") BASE_PATH="/" ;;
  /*) ;;
  *) BASE_PATH="/${BASE_PATH}" ;;
esac
if [[ "$BASE_PATH" != "/" && "$BASE_PATH" != */ ]]; then
  BASE_PATH="${BASE_PATH}/"
fi

echo "SITE=${SITE}"
echo "BASE_PATH=${BASE_PATH}"
