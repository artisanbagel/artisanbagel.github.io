import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    repo: z.string().url().optional(),
    link: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
