import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isAdminContentRepo, resolveWorkspaceRoot } from '../../src/core/workspaceRoot';

function seedAdminLayout(root: string) {
  mkdirSync(join(root, 'src/i18n/pages'), { recursive: true });
  writeFileSync(join(root, 'src/i18n/site.pt.yml'), 'nav: {}\n');
  writeFileSync(join(root, 'src/i18n/pages/contact.pt.yml'), 'title: c\n');
}

describe('workspaceRoot', () => {
  it('detects admin content layout', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-'));
    expect(isAdminContentRepo(root)).toBe(false);
    seedAdminLayout(root);
    expect(isAdminContentRepo(root)).toBe(true);
  });

  it('prefers env dir then candidates then default', () => {
    const envRoot = mkdtempSync(join(tmpdir(), 'ws-env-'));
    const candidate = mkdtempSync(join(tmpdir(), 'ws-cand-'));
    const fallback = mkdtempSync(join(tmpdir(), 'ws-def-'));
    seedAdminLayout(envRoot);
    seedAdminLayout(candidate);

    expect(resolveWorkspaceRoot(fallback, [candidate], envRoot)).toBe(resolve(envRoot));
    expect(resolveWorkspaceRoot(fallback, [candidate], undefined)).toBe(resolve(candidate));
    expect(resolveWorkspaceRoot(fallback, [mkdtempSync(join(tmpdir(), 'ws-miss-'))], undefined)).toBe(
      resolve(fallback),
    );
    expect(resolveWorkspaceRoot(fallback, [], '/tmp/not-a-repo')).toBe(resolve(fallback));
  });
});
