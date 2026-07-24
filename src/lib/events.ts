import type { Locale } from './types';
import { withBase } from './paths';

/** Content id → public slug (`foo.en` → `foo`). */
export function eventSlug(id: string): string {
  return id.replace(/\.en$/, '');
}

export function eventDetailPath(locale: Locale, id: string): string {
  const slug = eventSlug(id);
  return withBase(locale === 'pt' ? `/calendario/${slug}` : `/en/schedule/${slug}`);
}
