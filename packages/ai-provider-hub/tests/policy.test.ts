import { describe, expect, it } from 'vitest';
import { createPolicyEnforcer } from '../src/policy/policy.impl.js';
import type { ProviderPolicy } from '../src/policy/types.js';

function policy(overrides: Partial<ProviderPolicy> = {}): ProviderPolicy {
  return { blockSensitiveData: true, piiProtection: true, requireLocalProviders: false, ...overrides };
}

describe('createPolicyEnforcer', () => {
  it('allows a request with no applicable constraints', () => {
    const enforcer = createPolicyEnforcer();
    const result = enforcer.evaluate({ organizationId: 'org-1' }, policy());
    expect(result.allowed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('rejects a provider not in the allow-list', () => {
    const enforcer = createPolicyEnforcer();
    const result = enforcer.evaluate(
      { organizationId: 'org-1', providerId: 'anthropic' },
      policy({ allowedProviders: ['openai'] }),
    );
    expect(result.allowed).toBe(false);
    expect(result.violations[0]).toMatch(/anthropic/);
  });

  it('rejects when estimated tokens exceed maxTokens', () => {
    const enforcer = createPolicyEnforcer();
    const result = enforcer.evaluate(
      { organizationId: 'org-1', estimatedTokens: 5000 },
      policy({ maxTokens: 1000 }),
    );
    expect(result.allowed).toBe(false);
  });

  it('rejects when estimated cost exceeds maxCostUsd', () => {
    const enforcer = createPolicyEnforcer();
    const result = enforcer.evaluate(
      { organizationId: 'org-1', estimatedCostUsd: '5.00' },
      policy({ maxCostUsd: '1.00' }),
    );
    expect(result.allowed).toBe(false);
  });

  it('rejects a non-local provider kind when requireLocalProviders is set', () => {
    const enforcer = createPolicyEnforcer();
    const result = enforcer.evaluate(
      { organizationId: 'org-1', providerKind: 'openai' },
      policy({ requireLocalProviders: true }),
    );
    expect(result.allowed).toBe(false);
  });

  it('allows a local provider kind when requireLocalProviders is set', () => {
    const enforcer = createPolicyEnforcer();
    const result = enforcer.evaluate(
      { organizationId: 'org-1', providerKind: 'ollama' },
      policy({ requireLocalProviders: true }),
    );
    expect(result.allowed).toBe(true);
  });

  it('flags prompt content containing an API-key-shaped secret', () => {
    const enforcer = createPolicyEnforcer();
    const result = enforcer.evaluate(
      { organizationId: 'org-1', promptContent: 'my key is sk-abcdefghijklmnopqrstuvwx' },
      policy(),
    );
    expect(result.allowed).toBe(false);
    expect(result.sanitized).toBe(true);
  });

  it('sanitizeContent redacts every secret-shaped match', () => {
    const enforcer = createPolicyEnforcer();
    const sanitized = enforcer.sanitizeContent('contact me at user@example.com or use sk-abcdefghijklmnopqrstuvwx');
    expect(sanitized).not.toContain('user@example.com');
    expect(sanitized).not.toContain('sk-abcdefghijklmnopqrstuvwx');
    expect(sanitized).toContain('[REDACTED]');
  });

  it('sanitizeContent leaves ordinary text untouched', () => {
    const enforcer = createPolicyEnforcer();
    expect(enforcer.sanitizeContent('hello world')).toBe('hello world');
  });
});
