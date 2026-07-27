import { describe, expect, it } from 'vitest';
import { createAuditEventRepository } from '../src/audit/repository.impl.js';
import { createAuditService } from '../src/audit/service.impl.js';
import { createPromptSecurityService } from '../src/prompt-security/service.impl.js';

const ORG = 'org-1';

function setup() {
  const auditRepository = createAuditEventRepository();
  const audit = createAuditService(auditRepository);
  const service = createPromptSecurityService(audit);
  return { audit, service };
}

describe('createPromptSecurityService — validatePrompt (pure)', () => {
  it('accepts a well-formed prompt', () => {
    const { service } = setup();
    expect(service.validatePrompt('Summarize this document.')).toEqual({ valid: true, violations: [] });
  });

  it('rejects an empty prompt', () => {
    const { service } = setup();
    const result = service.validatePrompt('');
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('empty_prompt');
  });

  it('rejects a prompt exceeding the max length', () => {
    const { service } = setup();
    const result = service.validatePrompt('a'.repeat(20), 10);
    expect(result.violations).toContain('max_length_exceeded');
  });

  it('rejects a prompt containing control characters', () => {
    const { service } = setup();
    const result = service.validatePrompt(`hello${String.fromCharCode(1)}world`);
    expect(result.violations).toContain('control_characters');
  });

  it('allows legitimate whitespace (tab, newline, carriage return)', () => {
    const { service } = setup();
    const result = service.validatePrompt('line one\nline two\tindented');
    expect(result.valid).toBe(true);
  });
});

describe('createPromptSecurityService — sanitizePrompt (pure)', () => {
  it('strips control characters', () => {
    const { service } = setup();
    expect(service.sanitizePrompt(`hello${String.fromCharCode(1)}world`)).toBe('helloworld');
  });

  it('collapses excessive spaces and tabs', () => {
    const { service } = setup();
    expect(service.sanitizePrompt('hello    world')).toBe('hello world');
  });

  it('collapses more than two consecutive newlines', () => {
    const { service } = setup();
    expect(service.sanitizePrompt('line one\n\n\n\nline two')).toBe('line one\n\nline two');
  });

  it('trims leading and trailing whitespace', () => {
    const { service } = setup();
    expect(service.sanitizePrompt('  hello  ')).toBe('hello');
  });
});

describe('createPromptSecurityService — real HMAC signatures', () => {
  it('signPrompt() is deterministic for the same key', () => {
    const { service } = setup();
    expect(service.signPrompt('hello', 'key')).toBe(service.signPrompt('hello', 'key'));
  });

  it('verifyPromptSignature() verifies a genuine signature', () => {
    const { service } = setup();
    const signature = service.signPrompt('hello', 'key');
    expect(service.verifyPromptSignature('hello', signature, 'key')).toBe(true);
  });

  it('verifyPromptSignature() rejects a tampered prompt', () => {
    const { service } = setup();
    const signature = service.signPrompt('hello', 'key');
    expect(service.verifyPromptSignature('goodbye', signature, 'key')).toBe(false);
  });
});

describe('createPromptSecurityService — auditPrompt (composes the shared Audit service)', () => {
  it('records a prompt-category audit entry', async () => {
    const { service, audit } = setup();
    await service.auditPrompt(ORG, { prompt: 'hello', identityId: 'identity-1', outcome: 'success' });
    const events = await audit.findByCategory(ORG, 'prompt');
    expect(events).toHaveLength(1);
    expect(events[0]?.actorId).toBe('identity-1');
  });

  it('records the prompt length, never the prompt text itself', async () => {
    const { service, audit } = setup();
    await service.auditPrompt(ORG, { prompt: 'a secret prompt', outcome: 'blocked' });
    const events = await audit.findByCategory(ORG, 'prompt');
    expect(events[0]?.details).toEqual({ length: 15 });
  });
});
