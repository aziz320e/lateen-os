import { describe, expect, it } from 'vitest';
import {
  createExtensionRegistry,
  createExtensionValidator,
  createDependencyResolver,
  createExtensionSystem,
  createKernelIntegration,
  isSdkCompatible,
  parseExtensionManifest,
  EXTENSION_EVENT_NAMES,
} from '../src/index.js';
import { createExtensionEventBus } from '../src/events/bus.js';
import { createExtensionLoader } from '../src/loader/extension-loader.js';
import { createHookRunner } from '../src/hooks/runner.js';

const sampleManifest = {
  id: 'sample-ext',
  name: 'sample-ext',
  displayName: 'Sample Extension',
  version: '1.0.0',
  author: 'Lateen OS',
  license: 'MIT',
  description: 'Sample extension for tests',
  category: 'platform' as const,
  type: 'plugin' as const,
  engineVersion: '1.0.0',
  sdkVersion: '1.0.0',
  permissions: ['events:publish'],
  dependencies: [],
};

describe('extension manifest', () => {
  it('parses valid extension.json', () => {
    const manifest = parseExtensionManifest(JSON.stringify(sampleManifest));
    expect(manifest.id).toBe('sample-ext');
    expect(manifest.type).toBe('plugin');
  });
});

describe('extension validator', () => {
  it('validates compatible manifest', () => {
    const validator = createExtensionValidator();
    const result = validator.validateManifest(sampleManifest);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid manifest', () => {
    const validator = createExtensionValidator();
    const result = validator.validateManifest({ id: 'BAD' });
    expect(result.valid).toBe(false);
  });
});

describe('extension registry', () => {
  it('installs and enables extensions', () => {
    const registry = createExtensionRegistry();
    const manifest = parseExtensionManifest(JSON.stringify(sampleManifest));
    registry.install(manifest, '/tmp/sample-ext');
    const enabled = registry.enable('sample-ext');
    expect(enabled.status).toBe('enabled');
    expect(registry.snapshot().enabled).toContain('sample-ext');
  });

  it('tracks disabled and failed states', () => {
    const registry = createExtensionRegistry();
    const manifest = parseExtensionManifest(JSON.stringify(sampleManifest));
    registry.install(manifest, '/tmp/sample-ext');
    registry.disable('sample-ext');
    expect(registry.snapshot().disabled).toContain('sample-ext');
    registry.markFailed('sample-ext', 'load error');
    expect(registry.get('sample-ext')?.status).toBe('failed');
  });
});

describe('dependency resolver', () => {
  it('detects missing dependencies', () => {
    const resolver = createDependencyResolver();
    const manifest = parseExtensionManifest(
      JSON.stringify({
        ...sampleManifest,
        dependencies: [{ id: 'missing-dep', version: '^1.0.0' }],
      }),
    );
    const result = resolver.resolve(manifest, new Map());
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === 'MISSING')).toBe(true);
  });
});

describe('extension loader', () => {
  it('loads and unloads extensions', async () => {
    const registry = createExtensionRegistry();
    const events = createExtensionEventBus();
    const loader = createExtensionLoader(registry, events, createHookRunner());
    const manifest = parseExtensionManifest(JSON.stringify(sampleManifest));
    registry.install(manifest, '/tmp/sample-ext');

    await loader.load('sample-ext');
    expect(loader.isLoaded('sample-ext')).toBe(true);

    await loader.unload('sample-ext');
    expect(loader.isLoaded('sample-ext')).toBe(false);
  });
});

describe('extension events', () => {
  it('emits extension.installed events', () => {
    const events = createExtensionEventBus();
    let received = false;
    events.subscribe(EXTENSION_EVENT_NAMES.ExtensionInstalled, () => {
      received = true;
    });
    events.publish(EXTENSION_EVENT_NAMES.ExtensionInstalled, 'sample-ext', {
      version: '1.0.0',
      path: '/tmp',
    });
    expect(received).toBe(true);
  });
});

describe('kernel integration', () => {
  it('registers enabled extensions with kernel plugin registry', () => {
    const registry = createExtensionRegistry();
    const manifest = parseExtensionManifest(JSON.stringify(sampleManifest));
    registry.install(manifest, '/tmp/sample-ext');
    registry.enable('sample-ext');

    const integration = createKernelIntegration();
    const mockKernel: { plugins: string[]; register(p: { id: string }): void } = { plugins: [], register(p) { this.plugins.push(p.id); } };
    const result = integration.registerExtensions(registry, mockKernel);
    expect(result.registered).toContain('sample-ext');
  });

  it('checks SDK compatibility', () => {
    const manifest = parseExtensionManifest(JSON.stringify(sampleManifest));
    expect(isSdkCompatible(manifest)).toBe(true);
  });
});

describe('extension system', () => {
  it('creates system facade', () => {
    const system = createExtensionSystem(process.cwd());
    expect(system.registry).toBeDefined();
    expect(system.loader).toBeDefined();
    expect(system.queries).toBeDefined();
  });
});
