import { mkdtempSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createContentService, savePayloadForPage } from '../../src/core/contentService';
import { parseIpcInput, parseIpcOutput } from '../../src/core/ipcSchema';
import { SiteTermsSchema } from '../../src/core/schemas';

const repoFixture = join(process.cwd(), '../..');

describe('contentService against real repo', () => {
  it('loads site terms from workspace when present', () => {
    const root = join(process.cwd(), '../..');
    const content = createContentService(root);
    const site = content.loadSiteTerms();
    expect(SiteTermsSchema.parse(site.pt).nav.capoeira).toBeTruthy();
    const contact = content.loadPageTerms('contact');
    expect(contact.pt.title).toBeTruthy();
    const gallery = content.loadGallery();
    expect(gallery.pt.items.length).toBeGreaterThan(0);
    const schedule = content.loadSchedule();
    expect(schedule.pt.classes.length).toBeGreaterThan(0);
    expect(content.listEvents().length).toBeGreaterThan(0);
  });

  it('savePayloadForPage routes by id', () => {
    const root = mkdtempSync(join(tmpdir(), 'admin-cs-'));
    mkdirSync(join(root, 'src/i18n/pages'), { recursive: true });
    mkdirSync(join(root, 'src/data'), { recursive: true });
    mkdirSync(join(root, 'src/content/events'), { recursive: true });
    // copy minimal site files from real repo
    cpSync(join(repoFixture, 'src/i18n/site.pt.yml'), join(root, 'src/i18n/site.pt.yml'));
    cpSync(join(repoFixture, 'src/i18n/site.en.yml'), join(root, 'src/i18n/site.en.yml'));
    const content = createContentService(root);
    const site = content.loadSiteTerms();
    site.pt.nav.capoeira = 'X';
    savePayloadForPage(content, 'site-terms', site);
    expect(content.loadSiteTerms().pt.nav.capoeira).toBe('X');
  });
});

describe('ipcSchema', () => {
  it('parses void and object inputs', () => {
    expect(parseIpcInput('auth.status', undefined)).toBeUndefined();
    expect(parseIpcInput('sync.resolve', { choice: 'discard-local' })).toEqual({
      choice: 'discard-local',
    });
    expect(() => parseIpcInput('sync.resolve', { choice: 'nope' })).toThrow();
  });

  it('parses outputs', () => {
    expect(parseIpcOutput('auth.signOut', { ok: true })).toEqual({ ok: true });
    expect(() => parseIpcOutput('auth.signOut', { ok: false })).toThrow();
  });
});
