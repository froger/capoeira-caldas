import { describe, expect, it } from 'vitest';
import { scopedPathsFor, siteTermsPath, pageTermsPath } from '../../src/core/contentPaths';

describe('contentPaths', () => {
  it('builds absolute paths', () => {
    expect(siteTermsPath('/repo', 'pt')).toContain('site.pt.yml');
    expect(pageTermsPath('/repo', 'contact', 'en')).toContain('pages/contact.en.yml');
  });

  it('scopes git paths per page', () => {
    expect(scopedPathsFor('site-terms')).toEqual([
      'src/i18n/site.pt.yml',
      'src/i18n/site.en.yml',
    ]);
    expect(scopedPathsFor('page-terms-contact')).toEqual([
      'src/i18n/pages/contact.pt.yml',
      'src/i18n/pages/contact.en.yml',
    ]);
    expect(scopedPathsFor('events')).toEqual(['src/content/events']);
    expect(scopedPathsFor('gallery')).toContain('public/images/products');
    expect(scopedPathsFor('timetable')).toHaveLength(2);
  });
});
