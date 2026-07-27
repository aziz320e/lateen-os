import { describe, expect, it } from 'vitest';
import { createRiskRepository } from '../src/risk/repository.impl.js';
import { canTransitionRisk, createRiskRegister } from '../src/risk/service.impl.js';
import { createGovernanceEventBus } from '../src/events/index.js';
import { InvalidRiskTransitionError, RiskNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createGovernanceEventBus()) {
  const repository = createRiskRepository();
  const register = createRiskRegister(repository, eventBus);
  return { repository, register, eventBus };
}

describe('canTransitionRisk (pure)', () => {
  it('allows open -> mitigating/accepted/escalated/closed', () => {
    expect(canTransitionRisk('open', 'mitigating')).toBe(true);
    expect(canTransitionRisk('open', 'accepted')).toBe(true);
    expect(canTransitionRisk('open', 'escalated')).toBe(true);
    expect(canTransitionRisk('open', 'closed')).toBe(true);
  });

  it('closed is terminal', () => {
    expect(canTransitionRisk('closed', 'open')).toBe(false);
    expect(canTransitionRisk('closed', 'mitigating')).toBe(false);
  });

  it('escalated can return to mitigating', () => {
    expect(canTransitionRisk('escalated', 'mitigating')).toBe(true);
  });
});

describe('createRiskRegister — createRisk', () => {
  it('creates an open risk', async () => {
    const { register } = setup();
    const risk = await register.createRisk(ORG, { title: 'Prompt injection exposure', category: 'security', riskLevel: 'high' });
    expect(risk.status).toBe('open');
    expect(risk.riskLevel).toBe('high');
  });

  it('publishes risk.created', async () => {
    const eventBus = createGovernanceEventBus();
    const { register } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('risk.created', (payload) => (seen = payload));
    const risk = await register.createRisk(ORG, { title: 'r', category: 'ai', riskLevel: 'critical' });
    expect(seen).toEqual({ organizationId: ORG, riskId: risk.id, riskLevel: 'critical' });
  });

  it('supports all four risk levels', async () => {
    const { register } = setup();
    const levels = ['low', 'medium', 'high', 'critical'] as const;
    for (const riskLevel of levels) {
      const risk = await register.createRisk(ORG, { title: `r-${riskLevel}`, category: 'ai', riskLevel });
      expect(risk.riskLevel).toBe(riskLevel);
    }
  });
});

describe('createRiskRegister — mitigation / acceptance / escalation / closure', () => {
  it('addMitigationPlan() transitions to mitigating', async () => {
    const { register } = setup();
    const risk = await register.createRisk(ORG, { title: 'r', category: 'ai', riskLevel: 'high' });
    const updated = await register.addMitigationPlan(ORG, risk.id, 'Add rate limiting');
    expect(updated.status).toBe('mitigating');
    expect(updated.mitigationPlan).toBe('Add rate limiting');
  });

  it('accept() transitions to accepted and stamps acceptedBy/acceptedAt', async () => {
    const { register } = setup();
    const risk = await register.createRisk(ORG, { title: 'r', category: 'ai', riskLevel: 'low' });
    const accepted = await register.accept(ORG, risk.id, 'ciso-1');
    expect(accepted.status).toBe('accepted');
    expect(accepted.acceptedBy).toBe('ciso-1');
    expect(accepted.acceptedAt).toBeDefined();
  });

  it('escalate() transitions to escalated and publishes risk.escalated', async () => {
    const eventBus = createGovernanceEventBus();
    const { register } = setup(eventBus);
    const risk = await register.createRisk(ORG, { title: 'r', category: 'ai', riskLevel: 'critical' });
    let seen: unknown;
    eventBus.subscribe('risk.escalated', (payload) => (seen = payload));
    const escalated = await register.escalate(ORG, risk.id);
    expect(escalated.status).toBe('escalated');
    expect(seen).toEqual({ organizationId: ORG, riskId: risk.id });
  });

  it('close() transitions to closed', async () => {
    const { register } = setup();
    const risk = await register.createRisk(ORG, { title: 'r', category: 'ai', riskLevel: 'low' });
    const closed = await register.close(ORG, risk.id);
    expect(closed.status).toBe('closed');
  });

  it('rejects transitions out of closed', async () => {
    const { register } = setup();
    const risk = await register.createRisk(ORG, { title: 'r', category: 'ai', riskLevel: 'low' });
    await register.close(ORG, risk.id);
    await expect(register.accept(ORG, risk.id, 'ciso-1')).rejects.toBeInstanceOf(InvalidRiskTransitionError);
  });

  it('throws RiskNotFoundError for an unknown risk', async () => {
    const { register } = setup();
    await expect(register.close(ORG, 'missing')).rejects.toBeInstanceOf(RiskNotFoundError);
  });
});

describe('createRiskRegister — get / listByLevel / listByStatus / org scoping', () => {
  it('get() returns null for an unknown risk', async () => {
    const { register } = setup();
    expect(await register.get(ORG, 'missing')).toBeNull();
  });

  it('listByLevel() filters correctly', async () => {
    const { register } = setup();
    await register.createRisk(ORG, { title: 'a', category: 'ai', riskLevel: 'high' });
    await register.createRisk(ORG, { title: 'b', category: 'ai', riskLevel: 'low' });
    const high = await register.listByLevel(ORG, 'high');
    expect(high).toHaveLength(1);
  });

  it('listByStatus() filters correctly', async () => {
    const { register } = setup();
    const risk = await register.createRisk(ORG, { title: 'a', category: 'ai', riskLevel: 'high' });
    await register.close(ORG, risk.id);
    const closed = await register.listByStatus(ORG, 'closed');
    expect(closed.map((r) => r.id)).toEqual([risk.id]);
  });

  it('is organization-scoped', async () => {
    const { register, repository } = setup();
    const risk = await register.createRisk(ORG, { title: 'a', category: 'ai', riskLevel: 'high' });
    expect(await repository.findById('org-2', risk.id)).toBeNull();
  });
});
