/** @module extension-configuration/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ExtensionConfigId, ExtensionId } from '../shared/identifiers.js';

export type { ExtensionConfigId };

export type ConfigFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface ConfigFieldSchema {
  readonly field: string;
  readonly type: ConfigFieldType;
  readonly required: boolean;
}

/** One configuration entry for an extension — either its `default` or an `isOverride: true` value for the same key. */
export interface ExtensionConfigEntry extends TenantAuditableEntity<ExtensionConfigId> {
  readonly extensionId: ExtensionId;
  readonly key: string;
  readonly value: unknown;
  readonly isOverride: boolean;
}
