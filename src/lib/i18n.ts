import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import type { Locale } from './types';

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
  return (dict.routes as Record<string, string>) ?? {};
}

export function alternateLocale(current: Locale): Locale {
  return current === 'pt' ? 'en' : 'pt';
}

/** Map a path to the other locale using matching keys in ui.*.yml `routes`. */
export function switchLocalePath(current: Locale, currentPath: string): string {
  const from = getRoutes(current);
  const to = getRoutes(alternateLocale(current));
  const normalized = currentPath.replace(/\/$/, '') || '/';

  for (const [key, path] of Object.entries(from)) {
    const routePath = path.replace(/\/$/, '') || '/';
    if (routePath === normalized) {
      return to[key] ?? (current === 'pt' ? `/en${normalized === '/' ? '/' : normalized}` : '/');
    }
  }

  if (current === 'pt') {
    return normalized === '/' ? '/en/' : `/en${normalized}`;
  }
  const stripped = normalized.replace(/^\/en/, '') || '/';
  return stripped;
}
