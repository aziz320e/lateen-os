/** @module extension-registry/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ExtensionId, PluginId } from '../shared/identifiers.js';

export type { ExtensionId };

export type ExtensionStatus = 'installed' | 'enabled' | 'disabled' | 'uninstalled';

/** One installed extension within an organization. */
export interface Extension extends TenantAuditableEntity<ExtensionId> {
  readonly key: string;
  readonly name: string;
  readonly currentVersion: string;
  readonly pluginId?: PluginId;
  readonly status: ExtensionStatus;
}
