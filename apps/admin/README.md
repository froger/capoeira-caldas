# Capoeira Admin (desktop)

Electron app for masters to edit site content without using git directly.

## Requirements

- Node 22+
- System `git` installed
- GitHub OAuth App with **Device Flow** enabled; set `GITHUB_OAUTH_CLIENT_ID`
- Scopes requested at login: `repo` + `workflow` (needed to push `.github/workflows/*`)

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
yarn test:coverage   # global ≥90%; auth + validation modules require ≥95–100%
```

Critical paths with stricter coverage floors: `deviceFlow` (login/poll failures), `tokenStore` (save/load/clear logout), `formErrors` + `schemas` (validation).

## Installers / GitHub Releases

Push a tag to build unsigned installers and attach them to a GitHub Release:

```bash
git tag admin-v0.1.0
git push origin admin-v0.1.0
```

Assets: Linux AppImage + `.deb`, macOS `.dmg`, Windows NSIS `.exe`.

Repo secret required for sign-in in the packaged app: `ADMIN_GITHUB_OAUTH_CLIENT_ID` (OAuth App client id with Device Flow).
