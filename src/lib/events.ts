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

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** True when the event calendar day is before today. */
export function isPastEvent(date: Date, now = new Date()): boolean {
  return startOfLocalDay(date) < startOfLocalDay(now);
}

/** True when the event is today or within the next `withinDays` days (inclusive). */
export function isSoonEvent(date: Date, withinDays = 15, now = new Date()): boolean {
  const today = startOfLocalDay(now);
  const eventDay = startOfLocalDay(date);
  if (eventDay < today) return false;
  const limit = new Date(today);
  limit.setDate(limit.getDate() + withinDays);
  return eventDay <= limit;
}
