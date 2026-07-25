import { mkdtempSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createContentService, savePayloadForPage } from '../../src/core/contentService';
import { productsDir, eventsDir } from '../../src/core/contentPaths';
import { listEventSlugs } from '../../src/core/eventsIO';
import { commitMessageFor, pageNameFromAdminId } from '../../src/core/commitMessages';

const repoRoot = join(process.cwd(), '../..');

describe('coverage gaps', () => {
  it('covers all commit messages and page ids', () => {
    const ids = [
      'site-terms',
      'page-terms-classes',
      'page-terms-about',
      'page-terms-contact',
      'page-terms-gallery',
      'page-terms-schedule',
      'page-terms-privacy',
      'events',
      'gallery',
      'timetable',
    ] as const;
    for (const id of ids) {
      expect(commitMessageFor(id).startsWith('updating ')).toBe(true);
    }
    expect(pageNameFromAdminId('page-terms-classes')).toBe('classes');
    expect(pageNameFromAdminId('page-terms-gallery')).toBe('gallery');
    expect(pageNameFromAdminId('page-terms-schedule')).toBe('schedule');
    expect(pageNameFromAdminId('page-terms-privacy')).toBe('privacy');
  });

  it('lists empty events dir and products path helper', () => {
    const root = mkdtempSync(join(tmpdir(), 'admin-empty-'));
    expect(listEventSlugs(root)).toEqual([]);
    expect(productsDir(root)).toContain('products');
    expect(eventsDir(root)).toContain('events');
  });

  it('saves page terms gallery timetable and events via savePayloadForPage', () => {
    const root = mkdtempSync(join(tmpdir(), 'admin-all-'));
    mkdirSync(join(root, 'src/i18n/pages'), { recursive: true });
    mkdirSync(join(root, 'src/data'), { recursive: true });
    mkdirSync(join(root, 'src/content/events'), { recursive: true });
    for (const locale of ['pt', 'en'] as const) {
      cpSync(
        join(repoRoot, `src/i18n/pages/contact.${locale}.yml`),
        join(root, `src/i18n/pages/contact.${locale}.yml`),
      );
      cpSync(
        join(repoRoot, `src/data/gallery.${locale}.yml`),
        join(root, `src/data/gallery.${locale}.yml`),
      );
      cpSync(
        join(repoRoot, `src/data/schedule.${locale}.yml`),
        join(root, `src/data/schedule.${locale}.yml`),
      );
    }
    const content = createContentService(root);
    const contact = content.loadPageTerms('contact');
    contact.pt.title = 'X';
    savePayloadForPage(content, 'page-terms-contact', contact);
    expect(content.loadPageTerms('contact').pt.title).toBe('X');

    const gallery = content.loadGallery();
    gallery.pt.items[0]!.title = 'G';
    savePayloadForPage(content, 'gallery', gallery);
    expect(content.loadGallery().pt.items[0]!.title).toBe('G');

    const schedule = content.loadSchedule();
    schedule.pt.classes[0]!.day = 'Domingo';
    savePayloadForPage(content, 'timetable', schedule);
    expect(content.loadSchedule().pt.classes[0]!.day).toBe('Domingo');

    savePayloadForPage(content, 'events', {
      pt: {
        slug: 'tmp',
        locale: 'pt',
        data: {
          title: 't',
          description: 'd',
          locale: 'pt',
          date: '2026-01-01',
          location: 'L',
        },
        body: 'b',
      },
      en: {
        slug: 'tmp',
        locale: 'en',
        data: {
          title: 'te',
          description: 'de',
          locale: 'en',
          date: '2026-01-01',
          location: 'L',
        },
        body: 'be',
      },
    });
    expect(content.listEvents()).toContain('tmp');
    expect(content.loadEvent('tmp').pt.slug).toBe('tmp');
    content.removeEvent('tmp');
    expect(() =>
      savePayloadForPage(content, 'nope' as never, {}),
    ).toThrow(/unknown page/);
  });
});
