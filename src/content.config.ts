import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const topics = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/topics',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string().optional(),
    navTitle: z.string().optional(),
    summary: z.string(),
    category: z.string(),
    order: z.number().default(100),
    updated: z.date(),
    badge: z.string().optional(),
    art: z.enum(['billing', 'hierarchy']).optional(),
    breadcrumb: z.array(z.string()).optional(),
  }),
});

export const collections = { topics };
