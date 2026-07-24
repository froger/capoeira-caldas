import type { AdminPageId, PageName } from './schemas';

export function commitMessageFor(pageId: AdminPageId): string {
  switch (pageId) {
    case 'site-terms':
      return 'updating site terms';
    case 'page-terms-classes':
      return 'updating classes terms';
    case 'page-terms-about':
      return 'updating about terms';
    case 'page-terms-contact':
      return 'updating contact terms';
    case 'page-terms-gallery':
      return 'updating gallery terms';
    case 'page-terms-schedule':
      return 'updating schedule terms';
    case 'page-terms-privacy':
      return 'updating privacy terms';
    case 'events':
      return 'updating events';
    case 'gallery':
      return 'updating gallery';
    case 'timetable':
      return 'updating timetable';
  }
}

export function pageNameFromAdminId(pageId: AdminPageId): PageName | null {
  switch (pageId) {
    case 'page-terms-classes':
      return 'classes';
    case 'page-terms-about':
      return 'about';
    case 'page-terms-contact':
      return 'contact';
    case 'page-terms-gallery':
      return 'gallery';
    case 'page-terms-schedule':
      return 'schedule';
    case 'page-terms-privacy':
      return 'privacy';
    default:
      return null;
  }
}

export function adminIdForPageTerms(name: PageName): AdminPageId {
  return `page-terms-${name}` as AdminPageId;
}
