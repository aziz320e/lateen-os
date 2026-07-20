/** @module configuration/types */
import { z } from 'zod';

export const extensionSystemConfigSchema = z.object({
  workspaceRoot: z.string().min(1),
  extensionsDir: z.string().default('extensions'),
  marketplaceCacheDir: z.string().default('.lateen/marketplace'),
  stateDir: z.string().default('.lateen/extensions'),
  hotReload: z.boolean().default(false),
  autoEnable: z.boolean().default(false),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type ExtensionSystemConfig = z.infer<typeof extensionSystemConfigSchema>;
