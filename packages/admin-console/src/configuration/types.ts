/** @module configuration/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { EnvironmentId, RuntimeConfigId } from '../shared/identifiers.js';

export type { RuntimeConfigId };

/**
 * One runtime configuration entry. An entry with no `environmentId`
 * is the organization-wide default for its `key`; an entry with an
 * `environmentId` overrides that default for that one environment.
 */
export interface RuntimeConfigEntry extends TenantAuditableEntity<RuntimeConfigId> {
  readonly environmentId?: EnvironmentId;
  readonly key: string;
  readonly value: unknown;
}

export type ConfigFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface ConfigFieldSchema {
  readonly field: string;
  readonly type: ConfigFieldType;
  readonly required: boolean;
}
