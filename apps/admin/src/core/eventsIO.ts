import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import matter from 'gray-matter';
import {
  EventDocSchema,
  type EventDoc,
  type Locale,
} from './schemas';
import { eventFilePath, eventsDir } from './contentPaths';

function stringifyEvent(doc: EventDoc): string {
  const { title, description, locale, date, location, rsvp_url, rsvp_label } = doc.data;
  const front: Record<string, string> = {
    title,
    description,
    locale,
    date,
    location,
  };
  if (rsvp_url) front.rsvp_url = rsvp_url;
  if (rsvp_label) front.rsvp_label = rsvp_label;

  const yamlLines = Object.entries(front)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');
  return `---\n${yamlLines}\n---\n\n${doc.body.replace(/^\n+/, '')}\n`;
}

export function listEventSlugs(repoRoot: string): string[] {
  const dir = eventsDir(repoRoot);
  if (!existsSync(dir)) return [];
  const slugs = new Set<string>();
  for (const file of readdirSync(dir)) {
    const m = file.match(/^(.+?)(?:\.en)?\.md$/);
    if (m?.[1]) slugs.add(m[1]);
  }
  return [...slugs].sort();
}

export function readEvent(repoRoot: string, slug: string, locale: Locale): EventDoc {
  const path = eventFilePath(repoRoot, slug, locale);
  const raw = readFileSync(path, 'utf-8');
  const parsed = matter(raw);
  const date =
    parsed.data.date instanceof Date
      ? parsed.data.date.toISOString().slice(0, 10)
      : String(parsed.data.date);
  return EventDocSchema.parse({
    slug,
    locale,
    data: {
      ...parsed.data,
      date,
      locale,
    },
    body: parsed.content.trim(),
  });
}

export function readEventPair(repoRoot: string, slug: string): { pt: EventDoc; en: EventDoc } {
  return {
    pt: readEvent(repoRoot, slug, 'pt'),
    en: readEvent(repoRoot, slug, 'en'),
  };
}

export function writeEvent(repoRoot: string, doc: EventDoc): void {
  const valid = EventDocSchema.parse(doc);
  const path = eventFilePath(repoRoot, valid.slug, valid.locale);
  writeFileSync(path, stringifyEvent(valid), 'utf-8');
}

export function writeEventPair(
  repoRoot: string,
  pair: { pt: EventDoc; en: EventDoc },
): void {
  if (pair.pt.slug !== pair.en.slug) {
    throw new Error('event pair slug mismatch');
  }
  writeEvent(repoRoot, { ...pair.pt, locale: 'pt', data: { ...pair.pt.data, locale: 'pt' } });
  writeEvent(repoRoot, { ...pair.en, locale: 'en', data: { ...pair.en.data, locale: 'en' } });
}

export function deleteEventPair(repoRoot: string, slug: string): void {
  for (const locale of ['pt', 'en'] as const) {
    const path = eventFilePath(repoRoot, slug, locale);
    if (existsSync(path)) unlinkSync(path);
  }
}
