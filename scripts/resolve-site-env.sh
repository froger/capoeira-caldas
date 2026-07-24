#!/usr/bin/env bash
# Resolve SITE + BASE_PATH for builds. Prints KEY=value lines for GITHUB_ENV / dotenv.
# Priority: explicit env → GitHub Actions inputs/vars (passed in) → defaults from OWNER/REPO.
set -euo pipefail

OWNER="${OWNER:-local}"
REPO="${REPO:-capoeira}"
SITE="${INPUT_SITE:-${VAR_SITE:-${SITE:-https://${OWNER}.github.io}}}"
BASE_PATH="${INPUT_BASE_PATH:-${VAR_BASE_PATH:-${BASE_PATH:-/${REPO}/}}}"

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
