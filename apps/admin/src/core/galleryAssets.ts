import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { productsDir } from './contentPaths';

export type CopiedProductImage = {
  publicPath: string;
  absolutePath: string;
  fileName: string;
};

function safeFileName(sourcePath: string): string {
  const ext = extname(sourcePath).toLowerCase() || '.jpg';
  const stem = basename(sourcePath, extname(sourcePath))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'image';
  return `${stem}-${Date.now()}${ext}`;
}

export function copyProductImages(
  repoRoot: string,
  sourcePaths: string[],
): CopiedProductImage[] {
  const dir = productsDir(repoRoot);
  mkdirSync(dir, { recursive: true });
  const out: CopiedProductImage[] = [];
  for (const source of sourcePaths) {
    if (!existsSync(source)) {
      throw new Error(`image not found: ${source}`);
    }
    const fileName = safeFileName(source);
    const absolutePath = join(dir, fileName);
    copyFileSync(source, absolutePath);
    out.push({
      fileName,
      absolutePath,
      publicPath: `/images/products/${fileName}`,
    });
  }
  return out;
}

export function absolutePublicAsset(repoRoot: string, publicPath: string): string {
  const relative = publicPath.replace(/^\//, '');
  return join(repoRoot, 'public', relative);
}
