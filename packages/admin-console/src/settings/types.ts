/** @module settings/types */
import type { Entity } from '@lateen-os/shared-kernel/core';
import type { Auditable } from '../shared/primitives.js';
import type { OrganizationId, SettingId, TenantId } from '../shared/identifiers.js';

export type { SettingId };

export type SettingScope = 'global' | 'tenant' | 'organization';

export interface SettingVersionRecord {
  readonly version: number;
  readonly value: unknown;
  readonly changedAt: string;
}

/**
 * A versioned setting at one of three scopes. Deliberately not
 * `TenantAuditableEntity` — a `'global'`-scope setting has no
 * `organizationId` at all, so this package's usual tenant-scoped
 * repository pattern does not apply here (see `settings/repository.ts`).
 */
export interface Setting extends Entity<SettingId>, Auditable {
  readonly scope: SettingScope;
  readonly organizationId?: OrganizationId;
  readonly tenantId?: TenantId;
  readonly key: string;
  readonly value: unknown;
  readonly version: number;
  readonly history: readonly SettingVersionRecord[];
}
