import { join } from 'node:path';
import type { AdminPageId, Locale, PageName } from './schemas';
import { pageNameFromAdminId } from './commitMessages';

export function siteTermsPath(repoRoot: string, locale: Locale): string {
  return join(repoRoot, 'src', 'i18n', `site.${locale}.yml`);
}

export function pageTermsPath(repoRoot: string, page: PageName, locale: Locale): string {
  return join(repoRoot, 'src', 'i18n', 'pages', `${page}.${locale}.yml`);
}

export function galleryPath(repoRoot: string, locale: Locale): string {
  return join(repoRoot, 'src', 'data', `gallery.${locale}.yml`);
}

export function schedulePath(repoRoot: string, locale: Locale): string {
  return join(repoRoot, 'src', 'data', `schedule.${locale}.yml`);
}

export function eventsDir(repoRoot: string): string {
  return join(repoRoot, 'src', 'content', 'events');
}

export function productsDir(repoRoot: string): string {
  return join(repoRoot, 'public', 'images', 'products');
}

export function eventFilePath(repoRoot: string, slug: string, locale: Locale): string {
  const name = locale === 'pt' ? `${slug}.md` : `${slug}.en.md`;
  return join(eventsDir(repoRoot), name);
}

/** Relative paths (posix-ish for git) scoped to an admin page save. */
export function scopedPathsFor(pageId: AdminPageId): string[] {
  const page = pageNameFromAdminId(pageId);
  switch (pageId) {
    case 'site-terms':
      return ['src/i18n/site.pt.yml', 'src/i18n/site.en.yml'];
    case 'events':
      return ['src/content/events'];
    case 'gallery':
      return [
        'src/data/gallery.pt.yml',
        'src/data/gallery.en.yml',
        'public/images/products',
      ];
    case 'timetable':
      return ['src/data/schedule.pt.yml', 'src/data/schedule.en.yml'];
    default:
      if (!page) return [];
      return [`src/i18n/pages/${page}.pt.yml`, `src/i18n/pages/${page}.en.yml`];
  }
}
