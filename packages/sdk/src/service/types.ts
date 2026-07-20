/** @module service/types */
import { z } from 'zod';

export const serviceApiRouteSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string().min(1),
  description: z.string().optional(),
});

export const serviceHealthSchema = z.object({
  path: z.string().default('/health'),
  readyPath: z.string().optional(),
});

export const serviceEventSchema = z.object({
  name: z.string().regex(/^[a-z0-9_.]+$/),
  description: z.string().optional(),
});

export const serviceDefinitionInputSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(1),
  description: z.string().optional(),
  port: z.number().int().min(1024).max(65535),
  packageName: z.string().startsWith('@lateen-os/'),
  dependencies: z.array(z.string()).default([]),
});

export type ServiceApiRoute = z.infer<typeof serviceApiRouteSchema>;
export type ServiceHealth = z.infer<typeof serviceHealthSchema>;
export type ServiceEvent = z.infer<typeof serviceEventSchema>;
export type ServiceDefinitionInput = z.infer<typeof serviceDefinitionInputSchema>;

export interface ServiceDefinition extends ServiceDefinitionInput {
  readonly apiRoutes: readonly ServiceApiRoute[];
  readonly health: ServiceHealth;
  readonly events: readonly ServiceEvent[];
  readonly sdkVersion: string;
}
