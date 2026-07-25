import { describe, expect, it } from 'vitest';
import { createProviderRegistry } from '../src/provider/registry.impl.js';
import { PROVIDER_CATALOG } from '../src/provider/catalog.js';

describe('createProviderRegistry', () => {
  it('is pre-populated with the full provider catalog by default', () => {
    const registry = createProviderRegistry();
    expect(registry.list()).toHaveLength(PROVIDER_CATALOG.length);
  });

  it('finds a provider by id', () => {
    const registry = createProviderRegistry();
    expect(registry.get('openai')?.metadata.displayName).toBe('OpenAI');
  });

  it('returns undefined for an unknown provider id', () => {
    const registry = createProviderRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('filters providers by kind', () => {
    const registry = createProviderRegistry();
    const matches = registry.findByKind('anthropic');
    expect(matches).toHaveLength(1);
    expect(matches[0]!.metadata.id).toBe('anthropic');
  });

  it('filters providers by capability', () => {
    const registry = createProviderRegistry();
    const matches = registry.findByCapability('embeddings');
    expect(matches.length).toBeGreaterThan(0);
    for (const registration of matches) {
      expect(registration.metadata.capabilities).toContain('embeddings');
    }
  });

  it('registers a new provider and unregisters it', () => {
    const registry = createProviderRegistry();
    registry.register({
      metadata: {
        id: 'custom',
        kind: 'openai',
        displayName: 'Custom',
        description: 'Custom provider',
        capabilities: ['chat-completion'],
        supportsLocalDeployment: false,
        supportsReasoningModels: false,
      },
      configuration: {},
      status: 'active',
      priority: 0,
    });
    expect(registry.get('custom')).toBeDefined();

    registry.unregister('custom');
    expect(registry.get('custom')).toBeUndefined();
  });

  it('accepts a custom seed instead of the default catalog', () => {
    const registry = createProviderRegistry({ seed: [] });
    expect(registry.list()).toHaveLength(0);
  });

  it('getMetadata returns the metadata for a registered provider', () => {
    const registry = createProviderRegistry();
    expect(registry.getMetadata('openai')?.kind).toBe('openai');
  });
});
