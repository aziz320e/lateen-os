/** @module application/types */
import { z } from 'zod';

export const applicationRouteSchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const applicationPageSchema = z.object({
  route: z.string().min(1),
  title: z.string().min(1),
  layout: z.string().optional(),
});

export const applicationWidgetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slot: z.string().min(1),
});

export const applicationDefinitionInputSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(1),
  description: z.string().optional(),
  port: z.number().int().min(1024).max(65535).default(3000),
  packageName: z.string().startsWith('@lateen-os/'),
});

export type ApplicationRoute = z.infer<typeof applicationRouteSchema>;
export type ApplicationPage = z.infer<typeof applicationPageSchema>;
export type ApplicationWidget = z.infer<typeof applicationWidgetSchema>;
export type ApplicationDefinitionInput = z.infer<typeof applicationDefinitionInputSchema>;

export interface ApplicationDefinition extends ApplicationDefinitionInput {
  readonly routes: readonly ApplicationRoute[];
  readonly pages: readonly ApplicationPage[];
  readonly widgets: readonly ApplicationWidget[];
  readonly sdkVersion: string;
}
