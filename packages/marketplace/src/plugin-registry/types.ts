/** @module plugin-registry/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { PluginId } from '../shared/identifiers.js';

export type { PluginId };

export type PluginStatus = 'active' | 'deprecated' | 'archived';

/** A registered plugin definition — the capabilities/permissions/compatibility contract an Extension instantiates. */
export interface Plugin extends TenantAuditableEntity<PluginId> {
  readonly key: string;
  readonly name: string;
  readonly capabilities: readonly string[];
  readonly requiredPermissions: readonly string[];
  /** A single-operator semantic-version range (e.g. `">=1.2.0"`) the host platform version must satisfy. */
  readonly compatibleVersionRange: string;
  readonly status: PluginStatus;
}
