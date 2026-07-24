import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import type { Locale } from './types';
import { withBase } from './paths';

const i18nDir = resolve(process.cwd(), 'src/i18n');
const pagesDir = join(i18nDir, 'pages');

type UiDict = Record<string, unknown>;

const cache: Partial<Record<Locale, UiDict>> = {};

function loadYamlFile(path: string): UiDict {
  return parse(readFileSync(path, 'utf-8')) as UiDict;
}

function loadUi(locale: Locale): UiDict {
  if (!cache[locale]) {
    const site = loadYamlFile(join(i18nDir, `site.${locale}.yml`));
    const pages: Record<string, unknown> = {};
    for (const file of readdirSync(pagesDir)) {
      const match = file.match(new RegExp(`^(.+)\\.${locale}\\.yml$`));
      if (!match) continue;
      pages[match[1]] = loadYamlFile(join(pagesDir, file));
    }
    cache[locale] = { ...site, pages };
  }
  return cache[locale]!;
}

export function t(locale: Locale, key: string): string {
  const dict = loadUi(locale);
  const parts = key.split('.');
  let value: unknown = dict;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in (value as object)) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof value === 'string' ? value : key;
}

export function getNav(locale: Locale) {
  const dict = loadUi(locale);
  return (dict.nav as Record<string, string>) ?? {};
}

export function getRoutes(locale: Locale): Record<string, string> {
  const dict = loadUi(locale);
  const routes = (dict.routes as Record<string, string>) ?? {};
  return Object.fromEntries(
    Object.entries(routes).map(([key, value]) => [key, withBase(value)]),
  );
}

export function alternateLocale(current: Locale): Locale {
  return current === 'pt' ? 'en' : 'pt';
}

/** Strip Astro base prefix so locale switching can match logical routes. */
function logicalPath(path: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  let value = path;
  if (base && value.startsWith(base)) {
    value = value.slice(base.length) || '/';
  }
  return value.replace(/\/$/, '') || '/';
}

/** Map a path to the other locale using matching keys in site.*.yml `routes`. */
export function switchLocalePath(current: Locale, currentPath: string): string {
  const from = loadUi(current).routes as Record<string, string>;
  const to = getRoutes(alternateLocale(current));
  const normalized = logicalPath(currentPath);

  for (const [key, path] of Object.entries(from ?? {})) {
    const routePath = path.replace(/\/$/, '') || '/';
    if (routePath === normalized) {
      return to[key] ?? withBase(current === 'pt' ? (normalized === '/' ? '/en/' : `/en${normalized}`) : '/');
    }
  }

  const ptEvent = normalized.match(/^\/calendario\/([^/]+)$/);
  if (current === 'pt' && ptEvent) {
    return withBase(`/en/schedule/${ptEvent[1]}`);
  }
  const enEvent = normalized.match(/^\/en\/schedule\/([^/]+)$/);
  if (current === 'en' && enEvent) {
    return withBase(`/calendario/${enEvent[1]}`);
  }

  if (current === 'pt') {
    return withBase(normalized === '/' ? '/en/' : `/en${normalized}`);
  }
  const stripped = normalized.replace(/^\/en/, '') || '/';
  return withBase(stripped);
}
