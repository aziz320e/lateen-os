import { describe, expect, it } from 'vitest';
import { createRetentionRuleRepository } from '../src/data-security/repository.impl.js';
import { classifyData, createDataSecurityService, detectPii, isRetentionExpired, maskText, redactText } from '../src/data-security/engine.impl.js';

const ORG = 'org-1';

describe('detectPii (pure)', () => {
  it('detects an email address', () => {
    const matches = detectPii('Contact me at jordan@example.com please');
    expect(matches).toContainEqual({ piiType: 'email', value: 'jordan@example.com' });
  });

  it('detects a phone number', () => {
    const matches = detectPii('Call 555-123-4567 for support');
    expect(matches.some((match) => match.piiType === 'phone')).toBe(true);
  });

  it('detects an SSN-shaped string', () => {
    const matches = detectPii('SSN: 123-45-6789');
    expect(matches).toContainEqual({ piiType: 'ssn', value: '123-45-6789' });
  });

  it('detects a credit-card-shaped string', () => {
    const matches = detectPii('Card: 4111 1111 1111 1111');
    expect(matches.some((match) => match.piiType === 'credit_card')).toBe(true);
  });

  it('returns no matches for plain text', () => {
    expect(detectPii('Just a regular sentence with no PII.')).toEqual([]);
  });
});

describe('classifyData (pure)', () => {
  it('classifies SSN-bearing text as restricted', () => {
    expect(classifyData('SSN: 123-45-6789')).toBe('restricted');
  });

  it('classifies credit-card-bearing text as restricted', () => {
    expect(classifyData('4111 1111 1111 1111')).toBe('restricted');
  });

  it('classifies email-bearing text as confidential', () => {
    expect(classifyData('Contact jordan@example.com')).toBe('confidential');
  });

  it('classifies plain text as internal', () => {
    expect(classifyData('No sensitive data here.')).toBe('internal');
  });
});

describe('maskText (pure)', () => {
  it('partially masks an email, keeping the last 4 characters', () => {
    const masked = maskText('jordan@example.com');
    expect(masked).toBe('*'.repeat('jordan@example.com'.length - 4) + '.com');
  });

  it('leaves non-PII text untouched', () => {
    expect(maskText('nothing sensitive')).toBe('nothing sensitive');
  });
});

describe('redactText (pure)', () => {
  it('fully replaces detected PII with [REDACTED]', () => {
    expect(redactText('Email me at jordan@example.com')).toBe('Email me at [REDACTED]');
  });

  it('redacts multiple distinct PII matches', () => {
    const redacted = redactText('Email jordan@example.com or call 555-123-4567');
    expect(redacted).not.toContain('jordan@example.com');
    expect(redacted).not.toContain('555-123-4567');
  });
});

describe('isRetentionExpired (pure)', () => {
  it('returns false before the retention window elapses', () => {
    const rule = { retentionDays: 30 };
    expect(isRetentionExpired(rule, '2026-01-01T00:00:00.000Z', '2026-01-15T00:00:00.000Z')).toBe(false);
  });

  it('returns true after the retention window elapses', () => {
    const rule = { retentionDays: 30 };
    expect(isRetentionExpired(rule, '2026-01-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z')).toBe(true);
  });
});

function setup() {
  const repository = createRetentionRuleRepository();
  const service = createDataSecurityService(repository);
  return { repository, service };
}

describe('createDataSecurityService', () => {
  it('exposes the pure PII/classification/masking/redaction functions', () => {
    const { service } = setup();
    expect(service.detectPii('jordan@example.com')).toHaveLength(1);
    expect(service.classifyData('jordan@example.com')).toBe('confidential');
    expect(service.maskText('jordan@example.com')).not.toBe('jordan@example.com');
    expect(service.redactText('jordan@example.com')).toBe('[REDACTED]');
  });

  it('createRetentionRule() persists a real rule', async () => {
    const { service } = setup();
    const rule = await service.createRetentionRule(ORG, { dataClassification: 'confidential', retentionDays: 90 });
    expect(rule.retentionDays).toBe(90);
  });

  it('getRetentionRule() returns null for an unknown rule', async () => {
    const { service } = setup();
    expect(await service.getRetentionRule(ORG, 'missing')).toBeNull();
  });

  it('getRetentionRuleForClassification() finds the rule for a classification', async () => {
    const { service } = setup();
    await service.createRetentionRule(ORG, { dataClassification: 'restricted', retentionDays: 365 });
    const rule = await service.getRetentionRuleForClassification(ORG, 'restricted');
    expect(rule?.retentionDays).toBe(365);
  });

  it('isExpired() defaults "as of" to now()', async () => {
    const fixedNow = '2026-06-01T00:00:00.000Z';
    const repository = createRetentionRuleRepository();
    const service = createDataSecurityService(repository, () => fixedNow);
    const rule = await service.createRetentionRule(ORG, { dataClassification: 'internal', retentionDays: 30 });
    expect(service.isExpired(rule, '2026-01-01T00:00:00.000Z')).toBe(true);
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const rule = await service.createRetentionRule(ORG, { dataClassification: 'internal', retentionDays: 30 });
    expect(await repository.findById('org-2', rule.id)).toBeNull();
  });
});
