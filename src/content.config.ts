import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const events = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    locale: z.enum(['pt', 'en']),
    date: z.coerce.date(),
    location: z.string(),
    rsvp_url: z.string().optional(),
    type: z.enum(['roda', 'batizado', 'workshop', 'festa']),
  }),
});

export const collections = { events };
