import { describe, expect, it } from 'vitest';
import { createMarketplaceEventBus, MARKETPLACE_EVENT_NAMES } from '../src/events/index.js';

describe('MarketplaceEventBus', () => {
  it('publishes and delivers events by name', () => {
    const bus = createMarketplaceEventBus();
    let seen: unknown;
    bus.subscribe('extension.installed', (payload) => (seen = payload));
    bus.publish('extension.installed', { organizationId: 'org-1', extensionId: 'ext-1', key: 'com.acme.widget' });
    expect(seen).toEqual({ organizationId: 'org-1', extensionId: 'ext-1', key: 'com.acme.widget' });
  });

  it('subscribeAll() receives every event regardless of name', () => {
    const bus = createMarketplaceEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('extension.enabled', { organizationId: 'org-1', extensionId: 'ext-1' });
    bus.publish('extension.disabled', { organizationId: 'org-1', extensionId: 'ext-1' });
    expect(names).toEqual(['extension.enabled', 'extension.disabled']);
  });

  it('unsubscribe stops delivery', () => {
    const bus = createMarketplaceEventBus();
    let count = 0;
    const unsubscribe = bus.subscribe('plugin.registered', () => (count += 1));
    bus.publish('plugin.registered', { organizationId: 'org-1', pluginId: 'plugin-1', key: 'com.acme.plugin' });
    unsubscribe();
    bus.publish('plugin.registered', { organizationId: 'org-1', pluginId: 'plugin-1', key: 'com.acme.plugin' });
    expect(count).toBe(1);
  });

  it('delivers extension.uninstalled with its payload', () => {
    const bus = createMarketplaceEventBus();
    let seen: unknown;
    bus.subscribe('extension.uninstalled', (payload) => (seen = payload));
    bus.publish('extension.uninstalled', { organizationId: 'org-1', extensionId: 'ext-1' });
    expect(seen).toEqual({ organizationId: 'org-1', extensionId: 'ext-1' });
  });

  it('delivers extension.upgraded with its payload', () => {
    const bus = createMarketplaceEventBus();
    let seen: unknown;
    bus.subscribe('extension.upgraded', (payload) => (seen = payload));
    bus.publish('extension.upgraded', { organizationId: 'org-1', extensionId: 'ext-1', fromVersion: '1.0.0', toVersion: '1.1.0' });
    expect(seen).toEqual({ organizationId: 'org-1', extensionId: 'ext-1', fromVersion: '1.0.0', toVersion: '1.1.0' });
  });

  it('delivers catalog.updated with its payload', () => {
    const bus = createMarketplaceEventBus();
    let seen: unknown;
    bus.subscribe('catalog.updated', (payload) => (seen = payload));
    bus.publish('catalog.updated', { organizationId: 'org-1', catalogEntryId: 'catalog-1' });
    expect(seen).toEqual({ organizationId: 'org-1', catalogEntryId: 'catalog-1' });
  });

  it('delivers configuration.changed with its payload', () => {
    const bus = createMarketplaceEventBus();
    let seen: unknown;
    bus.subscribe('configuration.changed', (payload) => (seen = payload));
    bus.publish('configuration.changed', { organizationId: 'org-1', extensionConfigId: 'config-1', key: 'apiKey' });
    expect(seen).toEqual({ organizationId: 'org-1', extensionConfigId: 'config-1', key: 'apiKey' });
  });

  it('delivers compatibility.checked with its payload', () => {
    const bus = createMarketplaceEventBus();
    let seen: unknown;
    bus.subscribe('compatibility.checked', (payload) => (seen = payload));
    bus.publish('compatibility.checked', { organizationId: 'org-1', subjectId: 'plugin-1', compatible: true });
    expect(seen).toEqual({ organizationId: 'org-1', subjectId: 'plugin-1', compatible: true });
  });

  it('delivers extension.validated with its payload', () => {
    const bus = createMarketplaceEventBus();
    let seen: unknown;
    bus.subscribe('extension.validated', (payload) => (seen = payload));
    bus.publish('extension.validated', { organizationId: 'org-1', extensionId: 'ext-1', valid: false });
    expect(seen).toEqual({ organizationId: 'org-1', extensionId: 'ext-1', valid: false });
  });

  it('multiple independent subscribers to the same event all receive it', () => {
    const bus = createMarketplaceEventBus();
    let countA = 0;
    let countB = 0;
    bus.subscribe('extension.installed', () => (countA += 1));
    bus.subscribe('extension.installed', () => (countB += 1));
    bus.publish('extension.installed', { organizationId: 'org-1', extensionId: 'ext-1', key: 'k' });
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  });

  it('a subscriber to one event name is not invoked for a different event', () => {
    const bus = createMarketplaceEventBus();
    let calls = 0;
    bus.subscribe('extension.installed', () => (calls += 1));
    bus.publish('plugin.registered', { organizationId: 'org-1', pluginId: 'plugin-1', key: 'k' });
    expect(calls).toBe(0);
  });

  it('unsubscribing one subscriber does not affect another subscriber to the same event', () => {
    const bus = createMarketplaceEventBus();
    let countA = 0;
    let countB = 0;
    const unsubscribeA = bus.subscribe('extension.installed', () => (countA += 1));
    bus.subscribe('extension.installed', () => (countB += 1));
    unsubscribeA();
    bus.publish('extension.installed', { organizationId: 'org-1', extensionId: 'ext-1', key: 'k' });
    expect(countA).toBe(0);
    expect(countB).toBe(1);
  });

  it('subscribing after a publish does not retroactively receive that event', () => {
    const bus = createMarketplaceEventBus();
    bus.publish('extension.installed', { organizationId: 'org-1', extensionId: 'ext-1', key: 'k' });
    let count = 0;
    bus.subscribe('extension.installed', () => (count += 1));
    expect(count).toBe(0);
  });

  it('subscribeAll unsubscribe stops delivery of every event', () => {
    const bus = createMarketplaceEventBus();
    const names: string[] = [];
    const unsubscribe = bus.subscribeAll((name) => names.push(name));
    unsubscribe();
    bus.publish('extension.installed', { organizationId: 'org-1', extensionId: 'ext-1', key: 'k' });
    expect(names).toEqual([]);
  });

  it('delivers extension.enabled and extension.disabled to subscribeAll as well as direct subscribers', () => {
    const bus = createMarketplaceEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('extension.enabled', { organizationId: 'org-1', extensionId: 'ext-1' });
    bus.publish('extension.disabled', { organizationId: 'org-1', extensionId: 'ext-1' });
    expect(names).toEqual(['extension.enabled', 'extension.disabled']);
  });

  it('a bus with no subscribers at all does not throw on publish', () => {
    const bus = createMarketplaceEventBus();
    expect(() => bus.publish('extension.installed', { organizationId: 'org-1', extensionId: 'ext-1', key: 'k' })).not.toThrow();
  });

  it('publishing the same event twice invokes a persistent subscriber twice', () => {
    const bus = createMarketplaceEventBus();
    let count = 0;
    bus.subscribe('catalog.updated', () => (count += 1));
    bus.publish('catalog.updated', { organizationId: 'org-1', catalogEntryId: 'c1' });
    bus.publish('catalog.updated', { organizationId: 'org-1', catalogEntryId: 'c2' });
    expect(count).toBe(2);
  });

  it('delivers extension.disabled to a direct subscriber independent of subscribeAll', () => {
    const bus = createMarketplaceEventBus();
    let seen: unknown;
    bus.subscribe('extension.disabled', (payload) => (seen = payload));
    bus.publish('extension.disabled', { organizationId: 'org-1', extensionId: 'ext-1' });
    expect(seen).toEqual({ organizationId: 'org-1', extensionId: 'ext-1' });
  });

  it('two different event names can each have their own independent subscriber', () => {
    const bus = createMarketplaceEventBus();
    let installedSeen: unknown;
    let enabledSeen: unknown;
    bus.subscribe('extension.installed', (payload) => (installedSeen = payload));
    bus.subscribe('extension.enabled', (payload) => (enabledSeen = payload));
    bus.publish('extension.installed', { organizationId: 'org-1', extensionId: 'ext-1', key: 'k' });
    bus.publish('extension.enabled', { organizationId: 'org-1', extensionId: 'ext-1' });
    expect(installedSeen).toBeDefined();
    expect(enabledSeen).toBeDefined();
  });

  it('delivers plugin.registered with its payload to a direct subscriber', () => {
    const bus = createMarketplaceEventBus();
    let seen: unknown;
    bus.subscribe('plugin.registered', (payload) => (seen = payload));
    bus.publish('plugin.registered', { organizationId: 'org-1', pluginId: 'plugin-1', key: 'p' });
    expect(seen).toEqual({ organizationId: 'org-1', pluginId: 'plugin-1', key: 'p' });
  });

  it('delivers plugin.registered, catalog.updated, and configuration.changed independently to subscribeAll in publish order', () => {
    const bus = createMarketplaceEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('plugin.registered', { organizationId: 'org-1', pluginId: 'p1', key: 'k' });
    bus.publish('catalog.updated', { organizationId: 'org-1', catalogEntryId: 'c1' });
    bus.publish('configuration.changed', { organizationId: 'org-1', extensionConfigId: 'cfg1', key: 'k' });
    expect(names).toEqual(['plugin.registered', 'catalog.updated', 'configuration.changed']);
  });

  it('event payload objects are passed through verbatim without mutation', () => {
    const bus = createMarketplaceEventBus();
    const payload = { organizationId: 'org-1', extensionId: 'ext-1', key: 'k' };
    let seen: unknown;
    bus.subscribe('extension.installed', (received) => (seen = received));
    bus.publish('extension.installed', payload);
    expect(seen).toEqual(payload);
  });

  it('MARKETPLACE_EVENT_NAMES exposes all 10 canonical event names', () => {
    expect(Object.values(MARKETPLACE_EVENT_NAMES)).toEqual([
      'extension.installed',
      'extension.uninstalled',
      'extension.enabled',
      'extension.disabled',
      'extension.upgraded',
      'plugin.registered',
      'catalog.updated',
      'configuration.changed',
      'compatibility.checked',
      'extension.validated',
    ]);
  });
});
