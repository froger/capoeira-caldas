import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readLocalePair, writeLocalePair } from '../../src/core/localePair';
import { SiteTermsSchema } from '../../src/core/schemas';

describe('localePair', () => {
  it('writes and reads both locales atomically-shaped', () => {
    const root = mkdtempSync(join(tmpdir(), 'admin-lp-'));
    mkdirSync(join(root), { recursive: true });
    const paths = {
      pt: join(root, 'site.pt.yml'),
      en: join(root, 'site.en.yml'),
    };
    const data = {
      pt: {
        nav: { a: 'A' },
        routes: { home: '/' },
        footer: { x: 'x' },
        home: { h: 'h' },
        common: { c: 'c' },
      },
      en: {
        nav: { a: 'Ae' },
        routes: { home: '/en/' },
        footer: { x: 'xe' },
        home: { h: 'he' },
        common: { c: 'ce' },
      },
    };
    writeLocalePair(paths, data, SiteTermsSchema);
    expect(readFileSync(paths.pt, 'utf-8')).toContain('A');
    const loaded = readLocalePair(paths, SiteTermsSchema);
    expect(loaded.en.nav.a).toBe('Ae');
  });

  it('rejects invalid schema', () => {
    const root = mkdtempSync(join(tmpdir(), 'admin-lp-bad-'));
    const path = join(root, 'bad.yml');
    writeFileSync(path, 'nav: 1\n');
    expect(() => readLocalePair({ pt: path, en: path }, SiteTermsSchema)).toThrow();
  });
});
