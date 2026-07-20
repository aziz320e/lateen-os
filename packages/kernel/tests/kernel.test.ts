import { describe, expect, it } from 'vitest';
import { createDependencyGraphBuilder } from '../src/dependency/graph.js';
import { PLATFORM_MANIFEST } from '../src/registry/manifest.js';
import { loadKernelConfig } from '../src/configuration/loader.js';
import { validateEnvironment } from '../src/environment/validator.js';
import { createServiceRegistry, createApplicationRegistry, createPluginRegistry } from '../src/registry/index.js';
import { findWorkspaceRoot } from '../src/workspace/resolver.js';

describe('dependency graph', () => {
  it('resolves startup order without cycles', () => {
    const builder = createDependencyGraphBuilder();
    const graph = builder.build(PLATFORM_MANIFEST.services);
    const order = builder.resolveStartupOrder(graph);

    expect(order).toContain('business-dna-service');
    expect(order.indexOf('business-dna-service')).toBeLessThan(order.indexOf('product-discovery'));
    expect(order.indexOf('identity-service')).toBeLessThan(order.indexOf('integration-hub'));
  });
});

describe('configuration', () => {
  it('loads kernel config with defaults', () => {
    const root = findWorkspaceRoot();
    const config = loadKernelConfig({ workspaceRoot: root });

    expect(config.environment).toBeDefined();
    expect(config.workspaceRoot).toBe(root);
    expect(config.telemetryEnabled).toBe(true);
  });
});

describe('registries', () => {
  it('lists twelve platform services', () => {
    const services = createServiceRegistry().list();
    expect(services).toHaveLength(12);
    expect(services.map((s) => s.displayName)).toContain('Business DNA');
    expect(services.map((s) => s.displayName)).toContain('Mission Scheduler');
    expect(services.map((s) => s.displayName)).toContain('Cloud Control Plane');
  });

  it('lists registered applications including user-facing apps', () => {
    const apps = createApplicationRegistry().list();
    expect(apps).toHaveLength(13);
    expect(apps.map((a) => a.name)).toContain('lateen-assistant');
    expect(apps.map((a) => a.name)).toContain('ai-product-manager');
  });

  it('registers plugin kinds', () => {
    const plugins = createPluginRegistry().list();
    const kinds = new Set(plugins.map((p) => p.kind));
    expect(kinds.has('workflow')).toBe(true);
    expect(kinds.has('mission')).toBe(true);
    expect(kinds.has('ai-worker')).toBe(true);
  });
});

describe('environment validation', () => {
  it('reports missing env vars in empty environment', () => {
    const root = findWorkspaceRoot();
    const config = loadKernelConfig({ workspaceRoot: root, env: {} });
    const result = validateEnvironment(config, {});

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === 'MISSING_ENV')).toBe(true);
  });
});

describe('platform manifest', () => {
  it('matches architecture v1.0 service ports', () => {
    const byName = new Map(PLATFORM_MANIFEST.services.map((s) => [s.name, s.port]));
    expect(byName.get('business-dna-service')).toBe(4001);
    expect(byName.get('product-discovery')).toBe(4002);
    expect(byName.get('identity-service')).toBe(4003);
    expect(byName.get('integration-hub')).toBe(4004);
    expect(byName.get('mission-scheduler')).toBe(4005);
    expect(byName.get('marketplace')).toBe(4006);
    expect(byName.get('provisioning')).toBe(4007);
    expect(byName.get('api-gateway')).toBe(4008);
    expect(byName.get('knowledge-platform')).toBe(4009);
    expect(byName.get('search-platform')).toBe(4010);
    expect(byName.get('analytics-platform')).toBe(4011);
    expect(byName.get('cloud-control-plane')).toBe(4012);
  });
});
