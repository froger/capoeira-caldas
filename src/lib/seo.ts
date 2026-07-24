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
  locations?: { name: string; addressLocality: string; streetAddress?: string }[];
}): JsonLd {
  const schema: JsonLd = {
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

  if (opts.locations?.length) {
    schema.location = opts.locations.map((loc) => {
      const address: JsonLd = {
        '@type': 'PostalAddress',
        addressLocality: loc.addressLocality,
        addressCountry: 'PT',
      };
      if (loc.streetAddress) address.streetAddress = loc.streetAddress;
      return {
        '@type': 'Place',
        name: loc.name,
        address,
      };
    });
  }

  return schema;
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

export function faqPageSchema(items: { question: string; answer: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function eventSchema(opts: {
  name: string;
  description: string;
  startDate: Date | string;
  location: string;
  url: string;
  rsvpUrl?: string;
}): JsonLd {
  const startDate =
    opts.startDate instanceof Date
      ? opts.startDate.toISOString().slice(0, 10)
      : opts.startDate;

  const schema: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: opts.name,
    description: opts.description,
    startDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: opts.location,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PT',
      },
    },
    url: opts.url,
  };

  if (opts.rsvpUrl) {
    schema.offers = {
      '@type': 'Offer',
      url: opts.rsvpUrl,
      availability: 'https://schema.org/InStock',
    };
  }

  return schema;
}

export function personSchema(opts: {
  name: string;
  description: string;
  image: string;
  url: string;
  jobTitle?: string;
}): JsonLd {
  const schema: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: opts.name,
    description: opts.description,
    image: opts.image,
    url: opts.url,
  };
  if (opts.jobTitle) schema.jobTitle = opts.jobTitle;
  return schema;
}
