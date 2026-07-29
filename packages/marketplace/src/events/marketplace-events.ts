/** @module events/marketplace-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type ExtensionInstalledEvent = DomainEvent<
  'extension.installed',
  { readonly organizationId: string; readonly extensionId: string; readonly key: string }
>;

export type ExtensionUninstalledEvent = DomainEvent<
  'extension.uninstalled',
  { readonly organizationId: string; readonly extensionId: string }
>;

export type ExtensionEnabledEvent = DomainEvent<
  'extension.enabled',
  { readonly organizationId: string; readonly extensionId: string }
>;

export type ExtensionDisabledEvent = DomainEvent<
  'extension.disabled',
  { readonly organizationId: string; readonly extensionId: string }
>;

export type ExtensionUpgradedEvent = DomainEvent<
  'extension.upgraded',
  { readonly organizationId: string; readonly extensionId: string; readonly fromVersion: string; readonly toVersion: string }
>;

export type PluginRegisteredEvent = DomainEvent<
  'plugin.registered',
  { readonly organizationId: string; readonly pluginId: string; readonly key: string }
>;

export type CatalogUpdatedEvent = DomainEvent<
  'catalog.updated',
  { readonly organizationId: string; readonly catalogEntryId: string }
>;

export type ConfigurationChangedEvent = DomainEvent<
  'configuration.changed',
  { readonly organizationId: string; readonly extensionConfigId: string; readonly key: string }
>;

export type CompatibilityCheckedEvent = DomainEvent<
  'compatibility.checked',
  { readonly organizationId: string; readonly subjectId: string; readonly compatible: boolean }
>;

export type ExtensionValidatedEvent = DomainEvent<
  'extension.validated',
  { readonly organizationId: string; readonly extensionId: string; readonly valid: boolean }
>;

/** Canonical event names for external subscribers. */
export const MARKETPLACE_EVENT_NAMES = {
  ExtensionInstalled: 'extension.installed',
  ExtensionUninstalled: 'extension.uninstalled',
  ExtensionEnabled: 'extension.enabled',
  ExtensionDisabled: 'extension.disabled',
  ExtensionUpgraded: 'extension.upgraded',
  PluginRegistered: 'plugin.registered',
  CatalogUpdated: 'catalog.updated',
  ConfigurationChanged: 'configuration.changed',
  CompatibilityChecked: 'compatibility.checked',
  ExtensionValidated: 'extension.validated',
} as const;

/** Union of all Marketplace domain events. */
export type MarketplaceDomainEvent =
  | ExtensionInstalledEvent
  | ExtensionUninstalledEvent
  | ExtensionEnabledEvent
  | ExtensionDisabledEvent
  | ExtensionUpgradedEvent
  | PluginRegisteredEvent
  | CatalogUpdatedEvent
  | ConfigurationChangedEvent
  | CompatibilityCheckedEvent
  | ExtensionValidatedEvent;
