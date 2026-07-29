/**
 * Identifier types for the Admin Console bounded context.
 *
 * Sibling-owned entities referenced by this package (APIs, health
 * checks, KPIs, security/governance/compliance policies, compliance
 * frameworks, business profiles, knowledge entries) are addressed by
 * plain `string` foreign keys — this package never redefines another
 * package's identifier namespace.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { OrganizationId } from '@lateen-os/business-dna';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Administration — Organizations (keyed 1:1 with `OrganizationId`), Tenants, Environments. */
export type TenantId = Identifier;
export type EnvironmentId = Identifier;

/** Administration — Feature Flags. */
export type FeatureFlagId = Identifier;

/** Identity Administration. */
export type UserId = Identifier;
export type GroupId = Identifier;
export type RoleId = Identifier;
export type PermissionId = Identifier;

/** System Settings. */
export type SettingId = Identifier;
export type SettingVersionId = Identifier;

/** Configuration Management. */
export type RuntimeConfigId = Identifier;

/** Audit Center. */
export type AuditEntryId = Identifier;

/** Administration Dashboard. */
export type DashboardSnapshotId = Identifier;
