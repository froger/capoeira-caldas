# Capoeira Admin (desktop)

Electron app for masters to edit site content without using git directly.

## Requirements

- Node 22+
- System `git` installed
- GitHub OAuth App with **Device Flow** enabled; set `GITHUB_OAUTH_CLIENT_ID`

## Develop

```bash
cd apps/admin
yarn install
export GITHUB_OAUTH_CLIENT_ID=your_client_id
# optional: edit this checkout instead of a userData clone
export CAPOEIRA_REPO_DIR=/absolute/path/to/capoeira-caldas
yarn dev
```

If term pages are empty, the app is reading a clone that does not have `src/i18n/pages/` yet — point `CAPOEIRA_REPO_DIR` at this checkout (or Sync after those files are on `main`).

## Test / quality gate

```bash
yarn lint
yarn test:coverage   # fails under 90% lines/branches/functions/statements
```

## Installers

CI builds on tag `admin-v*` (Linux AppImage/deb, macOS dmg, Windows NSIS). Artifacts are unsigned in v1.

Download from the GitHub Release for that tag, install, sign in with GitHub, then edit and **Save** (publishes). Use **Sync** to pull remote changes.
