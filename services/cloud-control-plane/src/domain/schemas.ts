import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  domain: z.string().optional(),
  region: z.enum(['us', 'europe', 'middle-east', 'asia', 'custom']).optional(),
});

export const createTenantSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  plan: z.enum(['community', 'starter', 'professional', 'enterprise', 'partner']).optional(),
  region: z.enum(['us', 'europe', 'middle-east', 'asia', 'custom']).optional(),
});

export const tenantLifecycleSchema = z.object({
  action: z.enum(['provision', 'activate', 'suspend', 'resume', 'upgrade', 'downgrade', 'archive', 'delete']),
  plan: z.enum(['community', 'starter', 'professional', 'enterprise', 'partner']).optional(),
});

export const createDeploymentSchema = z.object({
  tenantId: z.string().min(1),
  environment: z.enum(['development', 'testing', 'staging', 'production']),
  region: z.enum(['us', 'europe', 'middle-east', 'asia', 'custom']).optional(),
  version: z.string().default('1.0.0'),
});

export const createSupportTicketSchema = z.object({
  organizationId: z.string().min(1),
  subject: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});
