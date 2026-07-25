import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { absolutePublicAsset, copyProductImages } from '../../src/core/galleryAssets';

describe('galleryAssets', () => {
  it('copies images and builds public paths', () => {
    const root = mkdtempSync(join(tmpdir(), 'admin-gal-'));
    const src = join(root, 'photo.PNG');
    writeFileSync(src, 'x');
    const [copied] = copyProductImages(root, [src]);
    expect(copied?.publicPath.startsWith('/images/products/')).toBe(true);
    expect(copied?.fileName.toLowerCase().endsWith('.png')).toBe(true);
  });

  it('throws when source image is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'admin-gal-miss-'));
    expect(() => copyProductImages(root, [join(root, 'nope.jpg')])).toThrow(/image not found/);
  });

  it('uses image fallback name and absolute public path', () => {
    const root = mkdtempSync(join(tmpdir(), 'admin-gal-name-'));
    const src = join(root, '!!!');
    writeFileSync(src, 'x');
    const [copied] = copyProductImages(root, [src]);
    expect(copied?.fileName.startsWith('image-')).toBe(true);
    expect(absolutePublicAsset(root, '/images/products/a.jpg')).toBe(
      join(root, 'public', 'images/products/a.jpg'),
    );
  });
});
