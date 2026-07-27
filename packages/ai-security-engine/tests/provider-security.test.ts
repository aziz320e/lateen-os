import { describe, expect, it, vi } from 'vitest';
import { createProviderRegistry, createModelRegistry } from '@lateen-os/ai-provider-hub';
import { createProviderSecurityPolicyRepository } from '../src/provider-security/repository.impl.js';
import { createProviderSecurityService } from '../src/provider-security/service.impl.js';
import { createSecurityEventBus } from '../src/events/security-event-bus.js';
import { ProviderPolicyNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createSecurityEventBus(), deps = {}) {
  const repository = createProviderSecurityPolicyRepository();
  const service = createProviderSecurityService(repository, deps, eventBus);
  return { repository, service, eventBus };
}

describe('createProviderSecurityService — allow/deny evaluation', () => {
  it('createPolicy() creates an active policy with empty lists by default', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'default' });
    expect(policy.status).toBe('active');
    expect(policy.allowedProviders).toEqual([]);
  });

  it('an empty allow list means everything not denied is allowed', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'default' });
    expect(service.isProviderAllowed(policy, 'openai')).toBe(true);
  });

  it('a non-empty allow list restricts to only listed values', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'restricted', allowedProviders: ['openai'] });
    expect(service.isProviderAllowed(policy, 'openai')).toBe(true);
    expect(service.isProviderAllowed(policy, 'anthropic')).toBe(false);
  });

  it('deny always wins over allow', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'p', allowedProviders: ['openai'], deniedProviders: ['openai'] });
    expect(service.isProviderAllowed(policy, 'openai')).toBe(false);
  });

  it('isModelAllowed() and isCapabilityAllowed() apply the same deny-wins rule', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, {
      name: 'p',
      deniedModels: ['gpt-4'],
      allowedCapabilities: ['chat-completion'],
    });
    expect(service.isModelAllowed(policy, 'gpt-4')).toBe(false);
    expect(service.isCapabilityAllowed(policy, 'chat-completion')).toBe(true);
    expect(service.isCapabilityAllowed(policy, 'vision')).toBe(false);
  });

  it('archivePolicy() sets status archived', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'p' });
    const archived = await service.archivePolicy(ORG, policy.id);
    expect(archived.status).toBe('archived');
  });

  it('throws ProviderPolicyNotFoundError for an unknown policy', async () => {
    const { service } = setup();
    await expect(service.archivePolicy(ORG, 'missing')).rejects.toBeInstanceOf(ProviderPolicyNotFoundError);
  });

  it('getPolicy() returns null for an unknown policy', async () => {
    const { service } = setup();
    expect(await service.getPolicy(ORG, 'missing')).toBeNull();
  });

  it('evaluateProviderRequest() allows a permitted provider/model/capability combination', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'p', allowedProviders: ['openai'] });
    const result = await service.evaluateProviderRequest(ORG, policy.id, { providerKind: 'openai', modelId: 'gpt-4', capabilities: ['chat-completion'] });
    expect(result.allowed).toBe(true);
  });

  it('evaluateProviderRequest() blocks a denied provider and publishes provider.blocked', async () => {
    const eventBus = createSecurityEventBus();
    const blocked = vi.fn();
    eventBus.subscribe('provider.blocked', blocked);
    const { service } = setup(eventBus);
    const policy = await service.createPolicy(ORG, { name: 'p', deniedProviders: ['openai'] });
    const result = await service.evaluateProviderRequest(ORG, policy.id, { providerKind: 'openai' });
    expect(result).toEqual({ allowed: false, reason: 'provider_not_allowed' });
    expect(blocked).toHaveBeenCalledTimes(1);
  });

  it('evaluateProviderRequest() blocks a denied model', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'p', deniedModels: ['gpt-4'] });
    const result = await service.evaluateProviderRequest(ORG, policy.id, { providerKind: 'openai', modelId: 'gpt-4' });
    expect(result).toEqual({ allowed: false, reason: 'model_not_allowed' });
  });

  it('evaluateProviderRequest() blocks a denied capability', async () => {
    const { service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'p', deniedCapabilities: ['vision'] });
    const result = await service.evaluateProviderRequest(ORG, policy.id, { providerKind: 'openai', capabilities: ['vision'] });
    expect(result).toEqual({ allowed: false, reason: 'capability_not_allowed' });
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const policy = await service.createPolicy(ORG, { name: 'p' });
    expect(await repository.findById('org-2', policy.id)).toBeNull();
  });
});

describe('createProviderSecurityService without AI Provider Hub', () => {
  it('isProviderRegisteredInHub() and isModelRegisteredInHub() return false', () => {
    const { service } = setup();
    expect(service.isProviderRegisteredInHub('openai')).toBe(false);
    expect(service.isModelRegisteredInHub('gpt-4')).toBe(false);
  });
});

describe('createProviderSecurityService with real AI Provider Hub registries', () => {
  it('isProviderRegisteredInHub() reflects a real registered provider', () => {
    const providerRegistry = createProviderRegistry({ seed: [] });
    providerRegistry.register({
      metadata: {
        id: 'provider-1',
        kind: 'openai',
        displayName: 'OpenAI',
        description: 'OpenAI provider',
        capabilities: ['chat-completion'],
        supportsLocalDeployment: false,
        supportsReasoningModels: true,
      },
      configuration: {},
      status: 'active',
      priority: 1,
    });
    const { service } = setup(createSecurityEventBus(), { providerRegistry });
    expect(service.isProviderRegisteredInHub('openai')).toBe(true);
    expect(service.isProviderRegisteredInHub('anthropic')).toBe(false);
  });

  it('isModelRegisteredInHub() reflects a real registered model', () => {
    const modelRegistry = createModelRegistry({ seed: [] });
    modelRegistry.register({
      metadata: {
        id: 'gpt-4',
        providerId: 'provider-1',
        providerKind: 'openai',
        displayName: 'GPT-4',
        modelCode: 'gpt-4',
        contextWindow: 8192,
        maxOutputTokens: 4096,
        capabilities: ['chat-completion'],
        tier: 'frontier',
        quality: 'highest',
        supportsReasoning: true,
        pricing: { promptTokenUsd: '0.00003', completionTokenUsd: '0.00006' },
      },
      enabled: true,
    });
    const { service } = setup(createSecurityEventBus(), { modelRegistry });
    expect(service.isModelRegisteredInHub('gpt-4')).toBe(true);
    expect(service.isModelRegisteredInHub('unknown-model')).toBe(false);
  });
});
