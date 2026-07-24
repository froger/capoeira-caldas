import { describe, expect, it } from 'vitest';
import {
  adminIdForPageTerms,
  commitMessageFor,
  pageNameFromAdminId,
} from '../../src/core/commitMessages';

describe('commitMessages', () => {
  it('maps admin pages to messages', () => {
    expect(commitMessageFor('site-terms')).toBe('updating site terms');
    expect(commitMessageFor('events')).toBe('updating events');
    expect(commitMessageFor('gallery')).toBe('updating gallery');
    expect(commitMessageFor('timetable')).toBe('updating timetable');
    expect(commitMessageFor('page-terms-contact')).toBe('updating contact terms');
  });

  it('maps page terms ids', () => {
    expect(pageNameFromAdminId('page-terms-about')).toBe('about');
    expect(pageNameFromAdminId('events')).toBeNull();
    expect(adminIdForPageTerms('privacy')).toBe('page-terms-privacy');
  });
});
