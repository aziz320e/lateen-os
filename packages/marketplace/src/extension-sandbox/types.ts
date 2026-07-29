/** @module extension-sandbox/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ExtensionId, SandboxProfileId } from '../shared/identifiers.js';

export type { SandboxProfileId };

export type IsolationLevel = 'none' | 'process' | 'container' | 'vm';

/**
 * Deterministic sandbox metadata for one extension — capabilities,
 * permissions, and a declared isolation level. Metadata only: this
 * module never executes any extension code.
 */
export interface SandboxProfile extends TenantAuditableEntity<SandboxProfileId> {
  readonly extensionId: ExtensionId;
  readonly allowedCapabilities: readonly string[];
  readonly grantedPermissions: readonly string[];
  readonly isolationLevel: IsolationLevel;
}
