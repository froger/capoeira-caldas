/** Map committed raster sources to build-generated WebP (see scripts/optimize-images.mjs). */
export function toWebpPath(path: string): string {
  return path.replace(/\.(jpe?g|png)$/i, '.webp');
}

/** Prefix site-relative paths with Astro/Vite `BASE_URL` (e.g. `/capoeira-caldas/`). Idempotent. */
export function withBase(path = '/'): string {
  if (/^(https?:|mailto:|tel:|\/\/)/i.test(path)) return path;

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  if (base && (path === base || path.startsWith(`${base}/`))) {
    return path;
  }

  if (path === '/' || path === '') {
    return base ? `${base}/` : '/';
  }

  if (path.startsWith('/#')) {
    return `${base}${path}`;
  }

  if (path.startsWith('#')) {
    return path;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
