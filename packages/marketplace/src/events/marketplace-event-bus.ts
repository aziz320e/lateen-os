/**
 * Real, typed event bus for the Marketplace runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/marketplace-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type MarketplaceEventMap = {
  'extension.installed': { readonly organizationId: string; readonly extensionId: string; readonly key: string };
  'extension.uninstalled': { readonly organizationId: string; readonly extensionId: string };
  'extension.enabled': { readonly organizationId: string; readonly extensionId: string };
  'extension.disabled': { readonly organizationId: string; readonly extensionId: string };
  'extension.upgraded': { readonly organizationId: string; readonly extensionId: string; readonly fromVersion: string; readonly toVersion: string };
  'plugin.registered': { readonly organizationId: string; readonly pluginId: string; readonly key: string };
  'catalog.updated': { readonly organizationId: string; readonly catalogEntryId: string };
  'configuration.changed': { readonly organizationId: string; readonly extensionConfigId: string; readonly key: string };
  'compatibility.checked': { readonly organizationId: string; readonly subjectId: string; readonly compatible: boolean };
  'extension.validated': { readonly organizationId: string; readonly extensionId: string; readonly valid: boolean };
};

export type MarketplaceEventBus = EventBus<MarketplaceEventMap>;

/** Creates an in-memory {@link MarketplaceEventBus}. */
export function createMarketplaceEventBus(): MarketplaceEventBus {
  return createEventBus<MarketplaceEventMap>();
}
