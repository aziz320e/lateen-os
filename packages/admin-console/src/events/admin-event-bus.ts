/**
 * Real, typed event bus for the Admin Console runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/admin-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type AdminEventMap = {
  'organization.created': { readonly organizationId: string; readonly name: string };
  'tenant.created': { readonly organizationId: string; readonly tenantId: string; readonly name: string };
  'user.created': { readonly organizationId: string; readonly userId: string; readonly email: string };
  'role.created': { readonly organizationId: string; readonly roleId: string; readonly name: string };
  'settings.updated': { readonly organizationId: string; readonly settingId: string; readonly key: string; readonly scope: string };
  'feature.enabled': { readonly organizationId: string; readonly featureFlagId: string; readonly key: string };
  'feature.disabled': { readonly organizationId: string; readonly featureFlagId: string; readonly key: string };
  'audit.recorded': { readonly organizationId: string; readonly auditEntryId: string; readonly action: string };
  'dashboard.generated': { readonly organizationId: string; readonly dashboardSnapshotId: string };
  'configuration.updated': { readonly organizationId: string; readonly runtimeConfigId: string; readonly key: string };
};

export type AdminEventBus = EventBus<AdminEventMap>;

/** Creates an in-memory {@link AdminEventBus}. */
export function createAdminEventBus(): AdminEventBus {
  return createEventBus<AdminEventMap>();
}
