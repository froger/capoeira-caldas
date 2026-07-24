import { z } from 'zod';
import {
  AdminPageIdSchema,
  ConflictChoiceSchema,
  EventDocSchema,
  GalleryFileSchema,
  PageNameSchema,
  PageTermsSchema,
  PublishStatusSchema,
  ScheduleFileSchema,
  SiteTermsSchema,
  SyncResultSchema,
} from './schemas';

const LocalePair = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({ pt: schema, en: schema });

export const IpcSchema = {
  'auth.status': {
    input: z.void(),
    output: z.object({ authenticated: z.boolean() }),
  },
  'auth.startDeviceFlow': {
    input: z.void(),
    output: z.object({
      userCode: z.string(),
      verificationUri: z.string(),
      verificationUriComplete: z.string(),
      expiresIn: z.number(),
      deviceCode: z.string(),
      interval: z.number(),
    }),
  },
  'auth.waitForToken': {
    input: z.object({
      deviceCode: z.string(),
      interval: z.number(),
    }),
    output: z.object({ ok: z.literal(true) }),
  },
  'shell.openExternal': {
    input: z.object({ url: z.string().url() }),
    output: z.object({ ok: z.literal(true) }),
  },
  'gallery.pickImages': {
    input: z.void(),
    output: z.object({
      images: z.array(
        z.object({
          publicPath: z.string(),
          fileUrl: z.string(),
        }),
      ),
    }),
  },
  'content.resolveAssets': {
    input: z.object({ publicPaths: z.array(z.string()) }),
    output: z.object({
      assets: z.array(
        z.object({
          publicPath: z.string(),
          fileUrl: z.string().nullable(),
        }),
      ),
    }),
  },
  'auth.signOut': {
    input: z.void(),
    output: z.object({ ok: z.literal(true) }),
  },
  'repo.ensure': {
    input: z.void(),
    output: z.object({ repoDir: z.string() }),
  },
  'content.loadSiteTerms': {
    input: z.void(),
    output: LocalePair(SiteTermsSchema),
  },
  'content.saveAndPublish': {
    input: z.object({
      pageId: AdminPageIdSchema,
      payload: z.unknown(),
    }),
    output: SyncResultSchema,
  },
  'content.loadPageTerms': {
    input: z.object({ page: PageNameSchema }),
    output: LocalePair(PageTermsSchema),
  },
  'content.loadGallery': {
    input: z.void(),
    output: LocalePair(GalleryFileSchema),
  },
  'content.loadSchedule': {
    input: z.void(),
    output: LocalePair(ScheduleFileSchema),
  },
  'content.listEvents': {
    input: z.void(),
    output: z.array(z.string()),
  },
  'content.loadEvent': {
    input: z.object({ slug: z.string() }),
    output: LocalePair(EventDocSchema),
  },
  'content.deleteEvent': {
    input: z.object({ slug: z.string() }),
    output: SyncResultSchema,
  },
  'sync.pull': {
    input: z.void(),
    output: SyncResultSchema,
  },
  'sync.resolve': {
    input: z.object({ choice: ConflictChoiceSchema }),
    output: SyncResultSchema,
  },
  'publish.status': {
    input: z.void(),
    output: PublishStatusSchema,
  },
} as const;

export type IpcChannel = keyof typeof IpcSchema;

export type IpcInput<C extends IpcChannel> = z.infer<(typeof IpcSchema)[C]['input']>;
export type IpcOutput<C extends IpcChannel> = z.infer<(typeof IpcSchema)[C]['output']>;

export function parseIpcInput<C extends IpcChannel>(
  channel: C,
  raw: unknown,
): IpcInput<C> {
  return IpcSchema[channel].input.parse(raw) as IpcInput<C>;
}

export function parseIpcOutput<C extends IpcChannel>(
  channel: C,
  raw: unknown,
): IpcOutput<C> {
  return IpcSchema[channel].output.parse(raw) as IpcOutput<C>;
}
