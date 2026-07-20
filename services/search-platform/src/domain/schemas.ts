import { z } from 'zod';

export const searchFiltersSchema = z.object({
  organizationId: z.string(),
  department: z.string().optional(),
  entityType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  owner: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  knowledgeType: z.string().optional(),
  workflow: z.string().optional(),
  mission: z.string().optional(),
  aiWorker: z.string().optional(),
  extension: z.string().optional(),
  marketplace: z.boolean().optional(),
  sources: z.array(z.string()).optional(),
});

export const searchRequestSchema = z.object({
  query: z.string().min(1),
  mode: z.string().default('hybrid'),
  filters: searchFiltersSchema,
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
  userId: z.string().optional(),
  correlationId: z.string().optional(),
});

export type SearchRequestInput = z.infer<typeof searchRequestSchema>;
