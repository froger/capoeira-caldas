import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import type { Locale } from './types';
import { withBase } from './paths';

const i18nDir = resolve(process.cwd(), 'src/i18n');

type UiDict = Record<string, string | Record<string, string>>;

const cache: Partial<Record<Locale, UiDict>> = {};

function loadUi(locale: Locale): UiDict {
  if (!cache[locale]) {
    const content = readFileSync(join(i18nDir, `ui.${locale}.yml`), 'utf-8');
    cache[locale] = parse(content) as UiDict;
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

/** Map a path to the other locale using matching keys in ui.*.yml `routes`. */
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

  if (current === 'pt') {
    return withBase(normalized === '/' ? '/en/' : `/en${normalized}`);
  }
  const stripped = normalized.replace(/^\/en/, '') || '/';
  return withBase(stripped);
}
