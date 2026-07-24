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

export function getRoutes(locale: Locale) {
  const dict = loadUi(locale);
  return (dict.routes as Record<string, string>) ?? {};
}

export function localePath(locale: Locale, ptPath: string): string {
  if (locale === 'pt') return ptPath;
  const routes = getRoutes('en');
  const ptRoutes = getRoutes('pt');
  const key = Object.entries(ptRoutes).find(([, v]) => v === ptPath)?.[0];
  if (key && routes[key]) return routes[key];
  return `/en${ptPath}`;
}

export function alternateLocale(current: Locale): Locale {
  return current === 'pt' ? 'en' : 'pt';
}

export function switchLocalePath(current: Locale, currentPath: string): string {
  const other = alternateLocale(current);
  if (current === 'pt') {
    const map: Record<string, string> = {
      '/': '/en/',
      '/aulas': '/en/classes',
      '/calendario': '/en/schedule',
      '/sobre': '/en/about',
      '/galeria': '/en/gallery',
      '/blog': '/en/blog',
      '/contato': '/en/contact',
      '/privacidade': '/en/privacy',
      '/termos': '/en/terms',
    };
    if (currentPath.startsWith('/blog/')) {
      return currentPath.replace('/blog/', '/en/blog/');
    }
    return map[currentPath] ?? `/en${currentPath}`;
  }
  const map: Record<string, string> = {
    '/en/': '/',
    '/en/classes': '/aulas',
    '/en/schedule': '/calendario',
    '/en/about': '/sobre',
    '/en/gallery': '/galeria',
    '/en/blog': '/blog',
    '/en/contact': '/contato',
    '/en/privacy': '/privacidade',
    '/en/terms': '/termos',
  };
  if (currentPath.startsWith('/en/blog/')) {
    return currentPath.replace('/en/blog/', '/blog/');
  }
  return map[currentPath] ?? (currentPath.replace('/en', '') || '/');
}
