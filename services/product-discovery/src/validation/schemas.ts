import { z } from 'zod';

export const organizationIdSchema = z.string().uuid();

export const runDiscoveryBodySchema = z.object({
  organizationId: organizationIdSchema,
  keywords: z.array(z.string().min(1)).optional(),
  sources: z.array(z.string()).optional(),
  runtimeAgentId: z.string().uuid().optional(),
});

export const listRunsQuerySchema = z.object({
  organizationId: organizationIdSchema,
});

export const getRunParamsSchema = z.object({
  id: z.string().uuid(),
});

export const getRunQuerySchema = z.object({
  organizationId: organizationIdSchema,
});

export const listRecommendationsQuerySchema = z.object({
  organizationId: organizationIdSchema,
  runId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
