import { z } from 'zod';

export const analyticsRequestSchema = z.object({
  organizationId: z.string().min(1),
  domain: z.string().optional(),
  dashboardId: z.string().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  correlationId: z.string().optional(),
});

export const exportRequestSchema = z.object({
  organizationId: z.string().min(1),
  format: z.enum(['pdf', 'excel', 'csv', 'json']),
  dashboardId: z.string().optional(),
});
