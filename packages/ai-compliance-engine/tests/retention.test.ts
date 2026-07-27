import { describe, expect, it } from 'vitest';
import { createComplianceRetentionRuleRepository } from '../src/retention/repository.impl.js';
import { createRetentionEngine, isRetentionExpired } from '../src/retention/engine.impl.js';
import { ComplianceRetentionRuleNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('isRetentionExpired (pure)', () => {
  it('returns false when within the retention window', () => {
    expect(isRetentionExpired({ retentionDays: 30 }, '2026-01-01T00:00:00.000Z', '2026-01-15T00:00:00.000Z')).toBe(false);
  });

  it('returns true when past the retention window', () => {
    expect(isRetentionExpired({ retentionDays: 30 }, '2026-01-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z')).toBe(true);
  });

  it('returns false exactly at the boundary', () => {
    const createdAt = '2026-01-01T00:00:00.000Z';
    const asOf = new Date(new Date(createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(isRetentionExpired({ retentionDays: 30 }, createdAt, asOf)).toBe(false);
  });
});

function setup() {
  const repository = createComplianceRetentionRuleRepository();
  const engine = createRetentionEngine(repository);
  return { repository, engine };
}

describe('createRetentionEngine — setRule', () => {
  it('creates a new rule for an unseen data category', async () => {
    const { engine } = setup();
    const rule = await engine.setRule(ORG, { dataCategory: 'audit_evidence', retentionDays: 365 });
    expect(rule.dataCategory).toBe('audit_evidence');
    expect(rule.retentionDays).toBe(365);
  });

  it('updates the existing rule rather than creating a second one', async () => {
    const { engine, repository } = setup();
    const first = await engine.setRule(ORG, { dataCategory: 'compliance_report', retentionDays: 90 });
    const second = await engine.setRule(ORG, { dataCategory: 'compliance_report', retentionDays: 180 });
    expect(second.id).toBe(first.id);
    expect(second.retentionDays).toBe(180);
    expect((await repository.findAll(ORG)).filter((r) => r.dataCategory === 'compliance_report')).toHaveLength(1);
  });

  it('supports all four retention data categories', async () => {
    const { engine } = setup();
    const categories = ['audit_evidence', 'compliance_report', 'assessment_history', 'policy_history'] as const;
    for (const dataCategory of categories) {
      const rule = await engine.setRule(ORG, { dataCategory, retentionDays: 30 });
      expect(rule.dataCategory).toBe(dataCategory);
    }
  });
});

describe('createRetentionEngine — getRule / listRules', () => {
  it('getRule() returns null for an unconfigured category', async () => {
    const { engine } = setup();
    expect(await engine.getRule(ORG, 'audit_evidence')).toBeNull();
  });

  it('listRules() returns every configured rule', async () => {
    const { engine } = setup();
    await engine.setRule(ORG, { dataCategory: 'audit_evidence', retentionDays: 365 });
    await engine.setRule(ORG, { dataCategory: 'policy_history', retentionDays: 730 });
    const rules = await engine.listRules(ORG);
    expect(rules).toHaveLength(2);
  });
});

describe('createRetentionEngine — isExpired', () => {
  it('returns false when no rule is configured for the category', async () => {
    const { engine } = setup();
    expect(await engine.isExpired(ORG, 'audit_evidence', '2020-01-01T00:00:00.000Z')).toBe(false);
  });

  it('returns true for a record older than the configured retention window', async () => {
    const { engine } = setup();
    await engine.setRule(ORG, { dataCategory: 'assessment_history', retentionDays: 30 });
    const expired = await engine.isExpired(ORG, 'assessment_history', '2020-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    expect(expired).toBe(true);
  });

  it('requireRule() throws for an unconfigured category', async () => {
    const { engine } = setup();
    await expect(engine.requireRule(ORG, 'audit_evidence')).rejects.toBeInstanceOf(ComplianceRetentionRuleNotFoundError);
  });

  it('requireRule() returns the rule once configured', async () => {
    const { engine } = setup();
    await engine.setRule(ORG, { dataCategory: 'audit_evidence', retentionDays: 400 });
    const rule = await engine.requireRule(ORG, 'audit_evidence');
    expect(rule.retentionDays).toBe(400);
  });

  it('returns false for a record within the window even with a very short retention', async () => {
    const { engine } = setup();
    await engine.setRule(ORG, { dataCategory: 'policy_history', retentionDays: 1 });
    const expired = await engine.isExpired(ORG, 'policy_history', '2026-01-01T00:00:00.000Z', '2026-01-01T12:00:00.000Z');
    expect(expired).toBe(false);
  });

  it('is organization-scoped', async () => {
    const { engine } = setup();
    await engine.setRule(ORG, { dataCategory: 'audit_evidence', retentionDays: 365 });
    expect(await engine.getRule('org-2', 'audit_evidence')).toBeNull();
  });
});
