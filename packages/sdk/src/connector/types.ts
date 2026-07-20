/** @module connector/types */
import { z } from 'zod';

export const connectorAuthSchema = z.object({
  type: z.enum(['none', 'api_key', 'oauth2', 'basic', 'custom']),
  config: z.record(z.string()).default({}),
});

export const connectorSyncSchema = z.object({
  mode: z.enum(['pull', 'push', 'bidirectional']),
  schedule: z.string().optional(),
  batchSize: z.number().int().positive().optional(),
});

export const connectorWebhookSchema = z.object({
  path: z.string().min(1),
  events: z.array(z.string()).default([]),
  secretEnvKey: z.string().optional(),
});

export const connectorManifestInputSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  provider: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().optional(),
  auth: connectorAuthSchema,
  sync: connectorSyncSchema.optional(),
  webhook: connectorWebhookSchema.optional(),
});

export type ConnectorAuth = z.infer<typeof connectorAuthSchema>;
export type ConnectorSync = z.infer<typeof connectorSyncSchema>;
export type ConnectorWebhook = z.infer<typeof connectorWebhookSchema>;
export type ConnectorManifestInput = z.infer<typeof connectorManifestInputSchema>;

export interface ConnectorManifest extends ConnectorManifestInput {
  readonly sdkVersion: string;
}
