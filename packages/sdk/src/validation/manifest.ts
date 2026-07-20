/** @module validation/manifest */
import { pluginManifestInputSchema } from '../plugin/types.js';
import { connectorManifestInputSchema } from '../connector/types.js';
import { workflowDefinitionInputSchema } from '../workflow/types.js';
import { missionDefinitionInputSchema } from '../mission/types.js';
import { workerProfileInputSchema } from '../worker/types.js';
import { safeValidateSchema } from './schemas.js';

export type ManifestKind = 'plugin' | 'connector' | 'workflow' | 'mission' | 'worker';

const schemas = {
  plugin: pluginManifestInputSchema,
  connector: connectorManifestInputSchema,
  workflow: workflowDefinitionInputSchema,
  mission: missionDefinitionInputSchema,
  worker: workerProfileInputSchema,
} as const;

export function validateManifest(kind: ManifestKind, input: unknown) {
  return safeValidateSchema(schemas[kind], input);
}
