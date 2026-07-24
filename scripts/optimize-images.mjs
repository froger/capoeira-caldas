/**
 * Build-time WebP generation for public/images.
 * Source of truth: jpg/jpeg/png committed in git. WebP is gitignored.
 */
import { readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import sharp from 'sharp';

const ROOT = join(process.cwd(), 'public', 'images');
const MAX_WIDTH = 640;
const QUALITY = 70;
const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!SOURCE_EXTS.has(extname(entry.name).toLowerCase())) continue;
    await convert(path);
  }
}

async function convert(src) {
  const out = src.replace(/\.(jpe?g|png)$/i, '.webp');
  const srcStat = await stat(src);
  try {
    const outStat = await stat(out);
    if (outStat.mtimeMs >= srcStat.mtimeMs) return;
  } catch {
    // missing output — convert
  }

  await sharp(src)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out);

  console.log(`optimize-images: ${out.replace(process.cwd() + '/', '')}`);
}

await walk(ROOT);
