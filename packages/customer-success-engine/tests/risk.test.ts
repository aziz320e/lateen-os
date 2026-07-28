import { describe, expect, it } from 'vitest';
import { createCustomerSuccessEventBus } from '../src/events/index.js';
import { canTransitionCustomerRisk, computeCustomerRiskLevel, computeCustomerRiskScore, createCustomerRiskEngine } from '../src/risk/engine.impl.js';
import { createCustomerRiskRepository } from '../src/risk/repository.impl.js';
import { CustomerRiskNotFoundError, InvalidCustomerRiskTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createCustomerSuccessEventBus();
  const engine = createCustomerRiskEngine(createCustomerRiskRepository(), eventBus);
  return { engine, eventBus };
}

describe('canTransitionCustomerRisk (pure)', () => {
  it('identified -> mitigating | accepted | occurred', () => {
    expect(canTransitionCustomerRisk('identified', 'mitigating')).toBe(true);
    expect(canTransitionCustomerRisk('identified', 'accepted')).toBe(true);
    expect(canTransitionCustomerRisk('identified', 'occurred')).toBe(true);
    expect(canTransitionCustomerRisk('identified', 'resolved')).toBe(false);
  });

  it('mitigating -> resolved | occurred', () => {
    expect(canTransitionCustomerRisk('mitigating', 'resolved')).toBe(true);
    expect(canTransitionCustomerRisk('mitigating', 'occurred')).toBe(true);
  });

  it('accepted -> occurred only', () => {
    expect(canTransitionCustomerRisk('accepted', 'occurred')).toBe(true);
    expect(canTransitionCustomerRisk('accepted', 'mitigating')).toBe(false);
  });

  it('resolved and occurred are terminal', () => {
    expect(canTransitionCustomerRisk('resolved', 'occurred')).toBe(false);
    expect(canTransitionCustomerRisk('occurred', 'identified')).toBe(false);
  });
});

describe('computeCustomerRiskScore / computeCustomerRiskLevel (pure)', () => {
  it('computeCustomerRiskScore is the product of probability and impact', () => {
    expect(computeCustomerRiskScore(3, 4)).toBe(12);
    expect(computeCustomerRiskScore(5, 5)).toBe(25);
  });

  it('computeCustomerRiskLevel bands the score deterministically', () => {
    expect(computeCustomerRiskLevel(5)).toBe('low');
    expect(computeCustomerRiskLevel(12)).toBe('medium');
    expect(computeCustomerRiskLevel(20)).toBe('high');
    expect(computeCustomerRiskLevel(25)).toBe('critical');
  });
});

describe('CustomerRiskEngine', () => {
  it('create() computes score and starts at identified status', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Champion left the company', probability: 3, impact: 4 });
    expect(risk.status).toBe('identified');
    expect(risk.score).toBe(12);
  });

  it('publishes risk.detected with the computed score', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('risk.detected', (payload) => (seen = payload));
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Champion left the company', probability: 3, impact: 4 });
    expect(seen).toEqual({ organizationId: ORG, riskId: risk.id, customerId: 'customer-1', score: 12 });
  });

  it('update() recomputes score when probability/impact change', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Champion left the company', probability: 3, impact: 4 });
    const updated = await engine.update(ORG, risk.id, { probability: 5, impact: 5 });
    expect(updated.score).toBe(25);
  });

  it('update() sets mitigation notes', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Champion left the company', probability: 3, impact: 4 });
    const updated = await engine.update(ORG, risk.id, { mitigation: 'Identify new champion' });
    expect(updated.mitigation).toBe('Identify new champion');
  });

  it('startMitigation() -> resolve() progresses the lifecycle', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Champion left the company', probability: 3, impact: 4 });
    const mitigating = await engine.startMitigation(ORG, risk.id);
    expect(mitigating.status).toBe('mitigating');
    const resolved = await engine.resolve(ORG, risk.id);
    expect(resolved.status).toBe('resolved');
  });

  it('accept() moves identified -> accepted', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Champion left the company', probability: 1, impact: 1 });
    const accepted = await engine.accept(ORG, risk.id);
    expect(accepted.status).toBe('accepted');
  });

  it('markOccurred() is reachable from identified, mitigating, and accepted', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Champion left the company', probability: 4, impact: 5 });
    const occurred = await engine.markOccurred(ORG, risk.id);
    expect(occurred.status).toBe('occurred');
  });

  it('rejects an invalid transition (resolved -> mitigating)', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Champion left the company', probability: 3, impact: 4 });
    await engine.startMitigation(ORG, risk.id);
    await engine.resolve(ORG, risk.id);
    await expect(engine.startMitigation(ORG, risk.id)).rejects.toBeInstanceOf(InvalidCustomerRiskTransitionError);
  });

  it('startMitigation()/update() throw CustomerRiskNotFoundError for an unknown risk', async () => {
    const { engine } = setup();
    await expect(engine.startMitigation(ORG, 'missing')).rejects.toBeInstanceOf(CustomerRiskNotFoundError);
    await expect(engine.update(ORG, 'missing', { title: 'x' })).rejects.toBeInstanceOf(CustomerRiskNotFoundError);
  });

  it('findByCustomer / findByStatus filter correctly', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'A', probability: 3, impact: 4 });
    await engine.create(ORG, { customerId: 'customer-2', title: 'B', probability: 1, impact: 1 });
    expect(await engine.findByCustomer(ORG, 'customer-1')).toEqual([risk]);
    expect(await engine.findByStatus(ORG, 'identified')).toHaveLength(2);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'A', probability: 3, impact: 4 });
    expect(await engine.get(ORG, risk.id)).toEqual(risk);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('risks are isolated per organization', async () => {
    const { engine } = setup();
    await engine.create(ORG, { customerId: 'customer-1', title: 'A', probability: 1, impact: 1 });
    await engine.create('org-2', { customerId: 'customer-1', title: 'A', probability: 1, impact: 1 });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('a minimal risk (probability 1, impact 1) scores the lowest possible value', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Minor', probability: 1, impact: 1 });
    expect(risk.score).toBe(1);
    expect(computeCustomerRiskLevel(risk.score)).toBe('low');
  });

  it('a maximal risk (probability 5, impact 5) scores critical', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Severe', probability: 5, impact: 5 });
    expect(risk.score).toBe(25);
    expect(computeCustomerRiskLevel(risk.score)).toBe('critical');
  });

  it('create() accepts an optional description and mitigation up front', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Champion left', description: 'Key stakeholder departed', probability: 2, impact: 3, mitigation: 'Identify new champion' });
    expect(risk.description).toBe('Key stakeholder departed');
    expect(risk.mitigation).toBe('Identify new champion');
  });

  it('update() without any fields leaves probability/impact/score unchanged', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Champion left', probability: 3, impact: 4 });
    const updated = await engine.update(ORG, risk.id, {});
    expect(updated.score).toBe(12);
    expect(updated.title).toBe('Champion left');
  });

  it('accept() throws InvalidCustomerRiskTransitionError when called on a mitigating risk', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'X', probability: 3, impact: 4 });
    await engine.startMitigation(ORG, risk.id);
    await expect(engine.accept(ORG, risk.id)).rejects.toBeInstanceOf(InvalidCustomerRiskTransitionError);
  });

  it('markOccurred() is reachable from accepted', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'X', probability: 1, impact: 1 });
    await engine.accept(ORG, risk.id);
    const occurred = await engine.markOccurred(ORG, risk.id);
    expect(occurred.status).toBe('occurred');
  });

  it('markOccurred() throws for an occurred risk (terminal)', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'X', probability: 1, impact: 1 });
    await engine.markOccurred(ORG, risk.id);
    await expect(engine.markOccurred(ORG, risk.id)).rejects.toBeInstanceOf(InvalidCustomerRiskTransitionError);
  });

  it('list() returns an empty array for an organization with no risks', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('findByStatus() returns an empty array when no risk matches', async () => {
    const { engine } = setup();
    await engine.create(ORG, { customerId: 'customer-1', title: 'X', probability: 1, impact: 1 });
    expect(await engine.findByStatus(ORG, 'resolved')).toEqual([]);
  });

  it('update() can change only the title, leaving probability/impact intact', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'Original', probability: 2, impact: 2 });
    const updated = await engine.update(ORG, risk.id, { title: 'Renamed' });
    expect(updated.title).toBe('Renamed');
    expect(updated.score).toBe(4);
  });

  it('a customer can have multiple concurrent risks tracked independently', async () => {
    const { engine } = setup();
    await engine.create(ORG, { customerId: 'customer-1', title: 'A', probability: 2, impact: 2 });
    await engine.create(ORG, { customerId: 'customer-1', title: 'B', probability: 4, impact: 4 });
    expect(await engine.findByCustomer(ORG, 'customer-1')).toHaveLength(2);
  });

  it('resolving one risk does not affect another risk for the same customer', async () => {
    const { engine } = setup();
    const first = await engine.create(ORG, { customerId: 'customer-1', title: 'A', probability: 2, impact: 2 });
    const second = await engine.create(ORG, { customerId: 'customer-1', title: 'B', probability: 2, impact: 2 });
    await engine.startMitigation(ORG, first.id);
    await engine.resolve(ORG, first.id);
    const reloadedSecond = await engine.get(ORG, second.id);
    expect(reloadedSecond?.status).toBe('identified');
  });

  it('get() returns null for a risk belonging to a different organization', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'A', probability: 2, impact: 2 });
    expect(await engine.get('org-2', risk.id)).toBeNull();
  });

  it('findByStatus() distinguishes mitigating from identified risks', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { customerId: 'customer-1', title: 'A', probability: 2, impact: 2 });
    await engine.startMitigation(ORG, risk.id);
    await engine.create(ORG, { customerId: 'customer-1', title: 'B', probability: 1, impact: 1 });
    expect(await engine.findByStatus(ORG, 'mitigating')).toHaveLength(1);
    expect(await engine.findByStatus(ORG, 'identified')).toHaveLength(1);
  });

  it('resolve() throws for an unknown risk', async () => {
    const { engine } = setup();
    await expect(engine.resolve(ORG, 'missing')).rejects.toBeInstanceOf(CustomerRiskNotFoundError);
  });
});
