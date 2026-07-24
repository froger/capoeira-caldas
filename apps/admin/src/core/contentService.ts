import {
  GalleryFileSchema,
  PageTermsSchema,
  ScheduleFileSchema,
  SiteTermsSchema,
  type AdminPageId,
  type EventDoc,
  type GalleryFile,
  type PageName,
  type PageTerms,
  type ScheduleFile,
  type SiteTerms,
} from './schemas';
import type { LocalePair } from './localePair';
import { readLocalePair, writeLocalePair } from './localePair';
import {
  galleryPath,
  pageTermsPath,
  schedulePath,
  siteTermsPath,
} from './contentPaths';
import {
  deleteEventPair,
  listEventSlugs,
  readEventPair,
  writeEventPair,
} from './eventsIO';
import { pageNameFromAdminId } from './commitMessages';

export type ContentService = {
  loadSiteTerms: () => LocalePair<SiteTerms>;
  saveSiteTerms: (data: LocalePair<SiteTerms>) => void;
  loadPageTerms: (page: PageName) => LocalePair<PageTerms>;
  savePageTerms: (page: PageName, data: LocalePair<PageTerms>) => void;
  loadGallery: () => LocalePair<GalleryFile>;
  saveGallery: (data: LocalePair<GalleryFile>) => void;
  loadSchedule: () => LocalePair<ScheduleFile>;
  saveSchedule: (data: LocalePair<ScheduleFile>) => void;
  listEvents: () => string[];
  loadEvent: (slug: string) => LocalePair<EventDoc>;
  saveEvent: (data: LocalePair<EventDoc>) => void;
  removeEvent: (slug: string) => void;
};

export function createContentService(repoRoot: string): ContentService {
  return {
    loadSiteTerms: () =>
      readLocalePair(
        { pt: siteTermsPath(repoRoot, 'pt'), en: siteTermsPath(repoRoot, 'en') },
        SiteTermsSchema,
      ),
    saveSiteTerms: (data) =>
      writeLocalePair(
        { pt: siteTermsPath(repoRoot, 'pt'), en: siteTermsPath(repoRoot, 'en') },
        data,
        SiteTermsSchema,
      ),
    loadPageTerms: (page) =>
      readLocalePair(
        { pt: pageTermsPath(repoRoot, page, 'pt'), en: pageTermsPath(repoRoot, page, 'en') },
        PageTermsSchema,
      ),
    savePageTerms: (page, data) =>
      writeLocalePair(
        { pt: pageTermsPath(repoRoot, page, 'pt'), en: pageTermsPath(repoRoot, page, 'en') },
        data,
        PageTermsSchema,
      ),
    loadGallery: () =>
      readLocalePair(
        { pt: galleryPath(repoRoot, 'pt'), en: galleryPath(repoRoot, 'en') },
        GalleryFileSchema,
      ),
    saveGallery: (data) =>
      writeLocalePair(
        { pt: galleryPath(repoRoot, 'pt'), en: galleryPath(repoRoot, 'en') },
        data,
        GalleryFileSchema,
      ),
    loadSchedule: () =>
      readLocalePair(
        { pt: schedulePath(repoRoot, 'pt'), en: schedulePath(repoRoot, 'en') },
        ScheduleFileSchema,
      ),
    saveSchedule: (data) =>
      writeLocalePair(
        { pt: schedulePath(repoRoot, 'pt'), en: schedulePath(repoRoot, 'en') },
        data,
        ScheduleFileSchema,
      ),
    listEvents: () => listEventSlugs(repoRoot),
    loadEvent: (slug) => readEventPair(repoRoot, slug),
    saveEvent: (data) => writeEventPair(repoRoot, data),
    removeEvent: (slug) => deleteEventPair(repoRoot, slug),
  };
}

export function savePayloadForPage(
  content: ContentService,
  pageId: AdminPageId,
  payload: unknown,
): void {
  const page = pageNameFromAdminId(pageId);
  switch (pageId) {
    case 'site-terms':
      content.saveSiteTerms(payload as LocalePair<SiteTerms>);
      return;
    case 'events':
      content.saveEvent(payload as LocalePair<EventDoc>);
      return;
    case 'gallery':
      content.saveGallery(payload as LocalePair<GalleryFile>);
      return;
    case 'timetable':
      content.saveSchedule(payload as LocalePair<ScheduleFile>);
      return;
    default:
      if (!page) throw new Error(`unknown page ${pageId}`);
      content.savePageTerms(page, payload as LocalePair<PageTerms>);
  }
}
