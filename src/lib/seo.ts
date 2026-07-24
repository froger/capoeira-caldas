import type { Locale } from './types';
import { withBase } from './paths';

export type JsonLd = Record<string, unknown>;

const SITE_FALLBACK = process.env.SITE || 'http://127.0.0.1:4321';

export function absoluteUrl(path: string, site?: string | URL): string {
  const origin = site ? String(site) : SITE_FALLBACK;
  const prefixed = /^(https?:)/i.test(path) ? path : withBase(path);
  return new URL(prefixed, origin).href;
}

export function organizationSchema(opts: {
  name: string;
  description: string;
  url?: string | URL;
  email: string;
  phone: string;
  address: string;
  city: string;
  sameAs: string[];
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: opts.name,
    description: opts.description,
    url: opts.url ? String(opts.url) : SITE_FALLBACK,
    telephone: opts.phone,
    email: opts.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: opts.address,
      addressLocality: opts.city,
      addressCountry: 'PT',
    },
    sameAs: opts.sameAs.filter(Boolean),
  };
}

export function webPageSchema(opts: {
  title: string;
  description: string;
  url: string;
  locale: Locale;
  siteName: string;
  siteUrl: string;
  type?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': opts.type ?? 'WebPage',
    name: opts.title,
    description: opts.description,
    url: opts.url,
    inLanguage: opts.locale === 'pt' ? 'pt-PT' : 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: opts.siteName,
      url: opts.siteUrl,
    },
  };
}

export function breadcrumbSchema(
  items: { label: string; href?: string }[],
  site?: string | URL,
): JsonLd | null {
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const entry: JsonLd = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
      };
      if (item.href) {
        entry.item = absoluteUrl(item.href, site);
      }
      return entry;
    }),
  };
}

export function webSiteSchema(opts: {
  name: string;
  description: string;
  url: string;
  locale: Locale;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: opts.locale === 'pt' ? 'pt-PT' : 'en',
  };
}
