import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Marker file that proves the i18n split (admin content layout) is present. */
export function isAdminContentRepo(root: string): boolean {
  return (
    existsSync(join(root, 'src/i18n/site.pt.yml')) &&
    existsSync(join(root, 'src/i18n/pages/contact.pt.yml'))
  );
}

/**
 * Prefer CAPOEIRA_REPO_DIR, then candidates (local checkout), then defaultDir.
 */
export function resolveWorkspaceRoot(
  defaultDir: string,
  candidates: string[],
  envDir: string | undefined = process.env.CAPOEIRA_REPO_DIR,
): string {
  if (envDir && isAdminContentRepo(envDir)) {
    return resolve(envDir);
  }
  for (const candidate of candidates) {
    const root = resolve(candidate);
    if (isAdminContentRepo(root)) return root;
  }
  return resolve(defaultDir);
}
