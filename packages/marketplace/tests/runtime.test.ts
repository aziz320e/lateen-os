import { describe, expect, it } from 'vitest';
import { createMarketplaceEventBus } from '../src/events/index.js';
import { createMarketplaceRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createMarketplaceRuntime — composition root', () => {
  it('wires every engine onto the returned runtime surface', () => {
    const marketplace = createMarketplaceRuntime();
    expect(marketplace.extensions).toBeDefined();
    expect(marketplace.plugins).toBeDefined();
    expect(marketplace.packages).toBeDefined();
    expect(marketplace.sandbox).toBeDefined();
    expect(marketplace.configuration).toBeDefined();
    expect(marketplace.extensionEvents).toBeDefined();
    expect(marketplace.catalog).toBeDefined();
    expect(marketplace.relationshipManagement).toBeDefined();
    expect(marketplace.queries).toBeDefined();
    expect(marketplace.events).toBeDefined();
  });

  it('is fully usable with zero deps — every collaborator degrades gracefully', async () => {
    const marketplace = createMarketplaceRuntime();
    expect(await marketplace.relationshipManagement.getApiGatewayContext(ORG)).toEqual([]);
    expect(await marketplace.relationshipManagement.getAdminOrganizationContext(ORG)).toBeNull();
  });

  it('an injected eventBus is used instead of creating a new one, and is the same instance returned as .events', () => {
    const eventBus = createMarketplaceEventBus();
    const marketplace = createMarketplaceRuntime({ eventBus });
    expect(marketplace.events).toBe(eventBus);
  });

  it('plugin events are observable on the injected eventBus', async () => {
    const eventBus = createMarketplaceEventBus();
    const marketplace = createMarketplaceRuntime({ eventBus });
    let seen: unknown;
    eventBus.subscribe('plugin.registered', (payload) => (seen = payload));
    const plugin = await marketplace.plugins.registerPlugin(ORG, { key: 'p1', name: 'Plugin One', compatibleVersionRange: '>=1.0.0' });
    expect(seen).toEqual({ organizationId: ORG, pluginId: plugin.id, key: 'p1' });
  });

  it('an injected now() clock is used across engines for deterministic timestamps', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const marketplace = createMarketplaceRuntime({ now: fixedNow });
    const extension = await marketplace.extensions.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    expect(extension.createdAt).toBe('2026-01-01T00:00:00.000Z');
    const packageVersion = await marketplace.packages.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0' });
    expect(packageVersion.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('an injected apiGateway dep flows through to relationshipManagement.getApiGatewayContext', async () => {
    const marketplace = createMarketplaceRuntime({ apiGateway: { queries: { findApis: async () => ({ apis: [{ id: 'api-1' } as never], total: 1 }) } as never } });
    expect(await marketplace.relationshipManagement.getApiGatewayContext(ORG)).toEqual([{ id: 'api-1' }]);
  });

  it('repositories are never part of the returned runtime surface', () => {
    const marketplace = createMarketplaceRuntime();
    expect(Object.keys(marketplace)).not.toContain('extensionRepository');
    expect(Object.keys(marketplace)).not.toContain('pluginRepository');
  });

  it('the extension registry is composed intra-package with the same package/plugin/sandbox engines returned on the runtime', async () => {
    const marketplace = createMarketplaceRuntime();
    const extension = await marketplace.extensions.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await marketplace.packages.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0' });
    await marketplace.sandbox.createSandboxProfile(ORG, { extensionId: extension.id });
    const result = await marketplace.extensions.validateExtension(ORG, extension.id);
    expect(result.valid).toBe(true);
  });

  it('the query layer and the extension registry both observe the same installed extension', async () => {
    const marketplace = createMarketplaceRuntime();
    const extension = await marketplace.extensions.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    const found = await marketplace.queries.findExtensions({ organizationId: ORG });
    expect(found.extensions.map((e) => e.id)).toContain(extension.id);
  });

  it('two independently created runtimes do not share state', async () => {
    const first = createMarketplaceRuntime();
    const second = createMarketplaceRuntime();
    await first.extensions.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    expect(await second.extensions.listExtensions(ORG)).toEqual([]);
  });

  it('an injected institutionalMemory dep flows through to relationshipManagement.logMarketplaceDecisionToMemory', async () => {
    const marketplace = createMarketplaceRuntime({ institutionalMemory: { lifecycle: { create: async () => ({ id: 'knowledge-1' } as never) } as never } });
    const entry = await marketplace.relationshipManagement.logMarketplaceDecisionToMemory(ORG, { decision: 'd', reason: 'r' });
    expect(entry).toEqual({ id: 'knowledge-1' });
  });

  it('the catalog engine and configuration engine are independently usable from the runtime', async () => {
    const marketplace = createMarketplaceRuntime();
    const entry = await marketplace.catalog.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    expect(entry.ratingAverage).toBe(0);
    const config = await marketplace.configuration.setDefault(ORG, { extensionId: 'ext-1', key: 'timeout', value: 30 });
    expect(config.value).toBe(30);
  });

  it('an injected adminConsole dep flows through to relationshipManagement.getAdminOrganizationContext', async () => {
    const marketplace = createMarketplaceRuntime({ adminConsole: { organizations: { getOrganization: async () => ({ id: ORG, name: 'Acme Co' } as never) } as never } });
    expect(await marketplace.relationshipManagement.getAdminOrganizationContext(ORG)).toEqual({ id: ORG, name: 'Acme Co' });
  });

  it('an injected observability dep flows through to relationshipManagement.getObservabilityHealthContext', async () => {
    const marketplace = createMarketplaceRuntime({ observability: { queries: { findHealth: async () => ({ checks: [{ id: 'check-1' } as never], total: 1 }) } as never } });
    expect(await marketplace.relationshipManagement.getObservabilityHealthContext(ORG)).toEqual([{ id: 'check-1' }]);
  });

  it('extensionEvents engine is reachable and functions independently from the runtime', async () => {
    const marketplace = createMarketplaceRuntime();
    const declaration = await marketplace.extensionEvents.declareSubscription(ORG, { extensionId: 'ext-1', eventName: 'extension.installed' });
    expect(declaration.direction).toBe('subscribes');
  });

  it('the plugin registry and extension registry share compatibility results when composed through the runtime', async () => {
    const marketplace = createMarketplaceRuntime();
    const plugin = await marketplace.plugins.registerPlugin(ORG, { key: 'p1', name: 'Plugin', compatibleVersionRange: '>=1.0.0' });
    const extension = await marketplace.extensions.install(ORG, { key: 'ext-1', name: 'Ext', currentVersion: '1.0.0', pluginId: plugin.id });
    await marketplace.packages.publishVersion(ORG, { extensionKey: 'ext-1', version: '1.0.0' });
    await marketplace.sandbox.createSandboxProfile(ORG, { extensionId: extension.id });
    const result = await marketplace.extensions.validateExtension(ORG, extension.id);
    expect(result.valid).toBe(true);
  });

  it('the query layer reflects catalog entries and plugins created through the same runtime', async () => {
    const marketplace = createMarketplaceRuntime();
    await marketplace.catalog.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    await marketplace.plugins.registerPlugin(ORG, { key: 'p1', name: 'Plugin', compatibleVersionRange: '>=1.0.0' });
    expect((await marketplace.queries.findCatalog({ organizationId: ORG })).total).toBe(1);
    expect((await marketplace.queries.findPlugins({ organizationId: ORG })).total).toBe(1);
  });

  it('createMarketplaceRuntime() defaults now to a real wall-clock ISO timestamp', async () => {
    const marketplace = createMarketplaceRuntime();
    const before = Date.now();
    const extension = await marketplace.extensions.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    const after = Date.now();
    const createdAtMs = new Date(extension.createdAt).getTime();
    expect(createdAtMs).toBeGreaterThanOrEqual(before);
    expect(createdAtMs).toBeLessThanOrEqual(after);
  });

  it('an injected communicationHub dep flows through to relationshipManagement.notifyMarketplaceEvent', async () => {
    const marketplace = createMarketplaceRuntime({
      communicationHub: {
        notifications: {
          create: async () => ({ id: 'notif-1' } as never),
          send: async () => ({ id: 'notif-1', status: 'sent' } as never),
        } as never,
      },
    });
    const result = await marketplace.relationshipManagement.notifyMarketplaceEvent(ORG, { title: 'Test' });
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('the package registry and extension sandbox engines are both independently reachable from the runtime', async () => {
    const marketplace = createMarketplaceRuntime();
    const packageVersion = await marketplace.packages.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0' });
    const profile = await marketplace.sandbox.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    expect(packageVersion.version).toBe('1.0.0');
    expect(profile.isolationLevel).toBe('none');
  });

  it('an injected aiRuntime dep flows through to relationshipManagement.getAgentContext', async () => {
    const marketplace = createMarketplaceRuntime({ aiRuntime: { findAgent: async () => ({ agents: [{ id: 'agent-1' } as never] }) } });
    expect(await marketplace.relationshipManagement.getAgentContext(ORG, 'agent-1')).toEqual({ id: 'agent-1' });
  });

  it('the marketplace catalog reflects a rating recorded through the same runtime instance', async () => {
    const marketplace = createMarketplaceRuntime();
    const entry = await marketplace.catalog.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    const rated = await marketplace.catalog.recordRating(ORG, entry.id, 5);
    expect(rated.ratingAverage).toBe(5);
  });

  it('an injected workflow dep flows through to relationshipManagement.raiseExtensionApprovalWorkflow', async () => {
    const marketplace = createMarketplaceRuntime({
      workflow: {
        defineWorkflow: async () => ({ definition: { id: 'definition-1' } as never }),
        startWorkflow: async () => ({ id: 'instance-1' } as never),
      },
    });
    const result = await marketplace.relationshipManagement.raiseExtensionApprovalWorkflow(ORG, { requestType: 'publish' });
    expect(result).toEqual({ workflowDefinitionId: 'definition-1', workflowInstanceId: 'instance-1' });
  });

  it('extension lifecycle events and catalog events are both observable on the same injected eventBus', async () => {
    const eventBus = createMarketplaceEventBus();
    const marketplace = createMarketplaceRuntime({ eventBus });
    const seen: string[] = [];
    eventBus.subscribeAll((name) => seen.push(name));
    await marketplace.extensions.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await marketplace.catalog.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'x', publisher: 'y' });
    expect(seen).toEqual(['extension.installed', 'catalog.updated']);
  });
});
