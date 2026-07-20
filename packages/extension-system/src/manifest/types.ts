/** @module manifest/types */
import { z } from 'zod';

export const EXTENSION_MANIFEST_FILENAME = 'extension.json';

export const extensionTypeSchema = z.enum([
  'application',
  'service',
  'plugin',
  'connector',
  'workflow',
  'mission',
  'ai-worker',
  'dashboard',
  'widget',
  'theme',
  'industry-pack',
]);

export const extensionCategorySchema = z.enum([
  'productivity',
  'analytics',
  'integration',
  'industry',
  'ui',
  'automation',
  'ai',
  'platform',
  'other',
]);

export const extensionDependencySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  version: z.string().min(1),
});

export const extensionManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[\w.-]+)?$/),
  author: z.string().min(1),
  license: z.string().min(1),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  description: z.string().min(1),
  category: extensionCategorySchema.default('other'),
  type: extensionTypeSchema,
  engineVersion: z.string().regex(/^\d+\.\d+\.\d+$/).default('1.0.0'),
  sdkVersion: z.string().regex(/^\d+\.\d+\.\d+$/).default('1.0.0'),
  permissions: z.array(z.string()).default([]),
  dependencies: z.array(extensionDependencySchema).default([]),
  optionalDependencies: z.array(extensionDependencySchema).default([]),
  commands: z.array(z.string()).default([]),
  routes: z.array(z.string()).default([]),
  events: z.array(z.string()).default([]),
  workers: z.array(z.string()).default([]),
  missions: z.array(z.string()).default([]),
  connectors: z.array(z.string()).default([]),
  workflows: z.array(z.string()).default([]),
  widgets: z.array(z.string()).default([]),
  themes: z.array(z.string()).default([]),
  industry: z.string().optional(),
  main: z.string().optional(),
  path: z.string().optional(),
});

export type ExtensionType = z.infer<typeof extensionTypeSchema>;
export type ExtensionCategory = z.infer<typeof extensionCategorySchema>;
export type ExtensionDependency = z.infer<typeof extensionDependencySchema>;
export type ExtensionManifest = z.infer<typeof extensionManifestSchema>;

export const PLATFORM_ENGINE_VERSION = '1.0.0';
export const PLATFORM_SDK_VERSION = '1.0.0';
