import { mkdtempSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveWorkspaceRoot, isAdminContentRepo } from '../../src/core/workspaceRoot';
import { copyProductImages, absolutePublicAsset } from '../../src/core/galleryAssets';

describe('workspaceRoot', () => {
  it('prefers env dir when valid', () => {
    const root = join(process.cwd(), '../..');
    expect(isAdminContentRepo(root)).toBe(true);
    expect(resolveWorkspaceRoot('/fallback', [], root)).toBe(root);
  });

  it('falls back to default', () => {
    const fallback = '/tmp/admin-fallback-ws';
    expect(resolveWorkspaceRoot(fallback, ['/nope'], undefined)).toBe(fallback);
  });
});

describe('galleryAssets', () => {
  it('copies images into public products', () => {
    const root = mkdtempSync(join(tmpdir(), 'gal-'));
    mkdirSync(join(root, 'public/images/products'), { recursive: true });
    const src = join(root, 'in.jpg');
    writeFileSync(src, 'fake');
    const copied = copyProductImages(root, [src]);
    expect(copied).toHaveLength(1);
    expect(copied[0]!.publicPath.startsWith('/images/products/')).toBe(true);
    expect(existsSync(copied[0]!.absolutePath)).toBe(true);
    expect(absolutePublicAsset(root, copied[0]!.publicPath)).toBe(copied[0]!.absolutePath);
  });
});
