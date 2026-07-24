// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

/**
 * Deploy URLs are env-driven (CI / Docker / local):
 *   SITE       — origin only, e.g. https://froger.github.io or https://www.example.org
 *   BASE_PATH  — pathname prefix, e.g. /capoeira-caldas/ or / for a custom domain at root
 */
function normalizeBase(value) {
  if (!value || value === '/') return '/';
  let base = value.startsWith('/') ? value : `/${value}`;
  if (!base.endsWith('/')) base += '/';
  return base;
}

const site = process.env.SITE || 'http://127.0.0.1:4321';
const base = normalizeBase(process.env.BASE_PATH ?? '/');

export default defineConfig({
  site,
  base,
  output: 'static',
  build: {
    inlineStylesheets: 'always',
  },
  i18n: {
    defaultLocale: 'pt',
    locales: ['pt', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        usePolling: true,
      },
    },
  },
  integrations: [sitemap()],
});
