import { describe, expect, it } from 'vitest';
import { createLateenSDK, definePlugin, defineWorker, defineWorkflow, defineConnector, defineMission } from '../src/index.js';
import { SdkEventBus, publish, subscribe } from '../src/events/bus.js';
import { validateManifest, validatePermissions } from '../src/validation/index.js';
import { createMockService, createTestSdk, collectEvents } from '../src/testing/index.js';
import { getTemplate, listTemplates } from '../src/templates/registry.js';

describe('LateenSDK', () => {
  it('creates SDK with version 1.0.0', () => {
    const sdk = createLateenSDK({ workspaceRoot: process.cwd(), environment: 'test' });
    expect(sdk.versionString).toBe('1.0.0');
    expect(sdk.context.version.architecture).toBe('1.0');
  });

  it('exposes all factories', () => {
    const sdk = createTestSdk();
    expect(sdk.applications).toBeDefined();
    expect(sdk.services).toBeDefined();
    expect(sdk.plugins).toBeDefined();
    expect(sdk.workers).toBeDefined();
    expect(sdk.workflows).toBeDefined();
    expect(sdk.missions).toBeDefined();
    expect(sdk.connectors).toBeDefined();
  });
});

describe('define helpers', () => {
  it('defines a valid plugin manifest', () => {
    const plugin = definePlugin({
      id: 'my-plugin',
      name: 'My Plugin',
      version: '1.0.0',
      kind: 'package',
      path: 'extensions/my-plugin',
      permissions: ['publish:events'],
      capabilities: ['reporting'],
    });

    expect(plugin.sdkVersion).toBe('1.0.0');
    expect(plugin.enabled).toBe(true);
  });

  it('defines a worker profile', () => {
    const worker = defineWorker({
      code: 'analyst',
      name: 'Analyst',
      role: 'analyst',
      skills: [{ id: 'research', name: 'Research', proficiency: '0.85' }],
    });

    expect(worker.skills).toHaveLength(1);
  });

  it('defines workflow with steps', () => {
    const workflow = defineWorkflow({
      code: 'onboard',
      name: 'Onboard',
      steps: [{ id: 's1', name: 'Start', type: 'task', order: 0 }],
    });

    expect(workflow.steps).toHaveLength(1);
  });

  it('defines connector manifest', () => {
    const connector = defineConnector({
      id: 'shopify',
      name: 'Shopify',
      provider: 'shopify',
      version: '1.0.0',
      auth: { type: 'oauth2', config: {} },
    });

    expect(connector.auth.type).toBe('oauth2');
  });

  it('defines mission with stages', () => {
    const mission = defineMission({
      code: 'launch',
      title: 'Launch Product',
      description: 'Launch a new product',
      stages: [{ id: 'plan', name: 'Plan', order: 0, objective: 'Plan launch' }],
    });

    expect(mission.stages).toHaveLength(1);
  });
});

describe('validation', () => {
  it('validates plugin manifests', () => {
    const result = validateManifest('plugin', {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      kind: 'package',
      path: 'extensions/test',
    });
    expect(result.success).toBe(true);
  });

  it('validates plugin permissions', () => {
    const plugin = definePlugin({
      id: 'p',
      name: 'P',
      version: '1.0.0',
      kind: 'package',
      path: 'extensions/p',
      permissions: ['read:workflows'],
    });

    const result = validatePermissions(plugin, ['read:workflows', 'write:workflows']);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('write:workflows');
  });
});

describe('events', () => {
  it('publishes and subscribes to events', async () => {
    const bus = new SdkEventBus();
    const events = await collectEvents<{ value: number }>(bus, 'test.event', async () => {
      publish(bus, 'test.event', { value: 42 });
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.payload.value).toBe(42);
  });

  it('unsubscribes handlers', () => {
    const bus = new SdkEventBus();
    let count = 0;
    const unsub = subscribe(bus, 'counter', () => {
      count += 1;
    });

    publish(bus, 'counter', {});
    unsub();
    publish(bus, 'counter', {});

    expect(count).toBe(1);
  });
});

describe('testing utilities', () => {
  it('creates mock service', () => {
    const service = createMockService({ name: 'test-svc' });
    expect(service.name).toBe('test-svc');
    expect(service.health.path).toBe('/health');
  });
});

describe('templates', () => {
  it('lists all template kinds', () => {
    expect(listTemplates()).toContain('plugin');
    expect(listTemplates()).toContain('worker');
    expect(listTemplates()).toContain('connector');
  });

  it('generates plugin template files', () => {
    const bundle = getTemplate('plugin', 'my-plugin');
    expect(bundle.files.some((f) => f.path === 'src/index.ts')).toBe(true);
    expect(bundle.files.find((f) => f.path === 'src/index.ts')?.content).toContain('definePlugin');
  });
});
