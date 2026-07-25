import { z } from 'zod';

export const LocaleSchema = z.enum(['pt', 'en']);
export type Locale = z.infer<typeof LocaleSchema>;

export const StringMapSchema = z.record(z.string(), z.string());

export const NestedStringMapSchema = z.record(
  z.string(),
  z.union([z.string(), z.record(z.string(), z.string())]),
);

export const SiteTermsSchema = z.object({
  nav: StringMapSchema,
  routes: StringMapSchema,
  footer: StringMapSchema,
  home: StringMapSchema,
  common: StringMapSchema,
});
export type SiteTerms = z.infer<typeof SiteTermsSchema>;

export const PageTermsSchema: z.ZodType<Record<string, string>> = z.record(
  z.string(),
  z.coerce.string(),
);
export type PageTerms = z.infer<typeof PageTermsSchema>;

export const PageNameSchema = z.enum([
  'classes',
  'about',
  'contact',
  'gallery',
  'schedule',
  'privacy',
]);
export type PageName = z.infer<typeof PageNameSchema>;

export const EventFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  locale: LocaleSchema,
  date: z.string().min(1),
  location: z.string().min(1),
  rsvp_url: z.string().optional(),
  rsvp_label: z.string().optional(),
});
export type EventFrontmatter = z.infer<typeof EventFrontmatterSchema>;

export const EventDocSchema = z.object({
  slug: z.string().min(1),
  locale: LocaleSchema,
  data: EventFrontmatterSchema,
  body: z.string(),
});
export type EventDoc = z.infer<typeof EventDocSchema>;

export const GalleryItemSchema = z.object({
  id: z.string().min(1),
  src: z.string(),
  title: z.string().min(1),
  price: z.string(),
  images: z.array(z.string()),
});
export type GalleryItem = z.infer<typeof GalleryItemSchema>;

export const GalleryFileSchema = z.object({
  items: z.array(GalleryItemSchema),
});
export type GalleryFile = z.infer<typeof GalleryFileSchema>;

export const ScheduleRowSchema = z.object({
  day: z.string().min(1),
  time: z.string().min(1),
  level: z.string().min(1),
  instructor: z.string().min(1),
  location: z.string().min(1),
  audience: z.enum(['kids', 'adult']).optional(),
});
export type ScheduleRow = z.infer<typeof ScheduleRowSchema>;

export const ScheduleFileSchema = z.object({
  classes: z.array(ScheduleRowSchema),
});
export type ScheduleFile = z.infer<typeof ScheduleFileSchema>;

export const AdminPageIdSchema = z.enum([
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
]);
export type AdminPageId = z.infer<typeof AdminPageIdSchema>;

export const PublishStatusSchema = z.object({
  status: z.enum(['queued', 'building', 'deploying', 'success', 'failure', 'cancelled', 'unknown']),
  conclusion: z.string().nullable(),
  htmlUrl: z.string().nullable(),
  runId: z.number().nullable(),
  updatedAt: z.string().nullable(),
});
export type PublishStatus = z.infer<typeof PublishStatusSchema>;

export const ConflictChoiceSchema = z.enum(['force-push-mine', 'discard-local']);
export type ConflictChoice = z.infer<typeof ConflictChoiceSchema>;

export const SyncResultSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ok') }),
  z.object({
    kind: z.literal('conflict'),
    localSha: z.string(),
    remoteSha: z.string(),
  }),
  z.object({ kind: z.literal('error'), message: z.string() }),
]);
export type SyncResult = z.infer<typeof SyncResultSchema>;
