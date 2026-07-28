import { describe, expect, it } from 'vitest';
import { createProjectEventBus } from '../src/events/index.js';
import { canTransitionRisk, computeRiskLevel, computeRiskScore, createProjectRiskEngine } from '../src/risk/engine.impl.js';
import { createProjectRiskRepository } from '../src/risk/repository.impl.js';
import { InvalidRiskTransitionError, ProjectRiskNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const PROJECT = 'project-1';

function setup() {
  const eventBus = createProjectEventBus();
  const engine = createProjectRiskEngine(createProjectRiskRepository(), eventBus);
  return { engine, eventBus };
}

describe('canTransitionRisk (pure)', () => {
  it('identified -> mitigating | accepted | occurred', () => {
    expect(canTransitionRisk('identified', 'mitigating')).toBe(true);
    expect(canTransitionRisk('identified', 'accepted')).toBe(true);
    expect(canTransitionRisk('identified', 'occurred')).toBe(true);
    expect(canTransitionRisk('identified', 'resolved')).toBe(false);
  });

  it('mitigating -> resolved | occurred', () => {
    expect(canTransitionRisk('mitigating', 'resolved')).toBe(true);
    expect(canTransitionRisk('mitigating', 'occurred')).toBe(true);
  });

  it('accepted -> occurred only', () => {
    expect(canTransitionRisk('accepted', 'occurred')).toBe(true);
    expect(canTransitionRisk('accepted', 'mitigating')).toBe(false);
  });

  it('resolved and occurred are terminal', () => {
    expect(canTransitionRisk('resolved', 'occurred')).toBe(false);
    expect(canTransitionRisk('occurred', 'identified')).toBe(false);
  });
});

describe('computeRiskScore / computeRiskLevel (pure)', () => {
  it('computeRiskScore is the product of probability and impact', () => {
    expect(computeRiskScore(3, 4)).toBe(12);
    expect(computeRiskScore(5, 5)).toBe(25);
  });

  it('computeRiskLevel bands the score deterministically', () => {
    expect(computeRiskLevel(4)).toBe('low');
    expect(computeRiskLevel(5)).toBe('low');
    expect(computeRiskLevel(6)).toBe('medium');
    expect(computeRiskLevel(12)).toBe('medium');
    expect(computeRiskLevel(13)).toBe('high');
    expect(computeRiskLevel(20)).toBe('high');
    expect(computeRiskLevel(21)).toBe('critical');
    expect(computeRiskLevel(25)).toBe('critical');
  });
});

describe('ProjectRiskEngine', () => {
  it('create() computes score and starts at identified status', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', probability: 3, impact: 4 });
    expect(risk.status).toBe('identified');
    expect(risk.score).toBe(12);
  });

  it('publishes risk.created with the computed score', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('risk.created', (payload) => (seen = payload));
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', probability: 3, impact: 4 });
    expect(seen).toEqual({ organizationId: ORG, riskId: risk.id, projectId: PROJECT, score: 12 });
  });

  it('update() recomputes score when probability/impact change', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', probability: 3, impact: 4 });
    const updated = await engine.update(ORG, risk.id, { probability: 5, impact: 5 });
    expect(updated.score).toBe(25);
  });

  it('update() sets mitigation notes', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', probability: 3, impact: 4 });
    const updated = await engine.update(ORG, risk.id, { mitigation: 'Dual-source the vendor' });
    expect(updated.mitigation).toBe('Dual-source the vendor');
  });

  it('startMitigation() -> resolve() progresses the lifecycle', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', probability: 3, impact: 4 });
    const mitigating = await engine.startMitigation(ORG, risk.id);
    expect(mitigating.status).toBe('mitigating');
    const resolved = await engine.resolve(ORG, risk.id);
    expect(resolved.status).toBe('resolved');
  });

  it('accept() moves identified -> accepted', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', probability: 1, impact: 1 });
    const accepted = await engine.accept(ORG, risk.id);
    expect(accepted.status).toBe('accepted');
  });

  it('markOccurred() is reachable from identified, mitigating, and accepted', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', probability: 4, impact: 5 });
    const occurred = await engine.markOccurred(ORG, risk.id);
    expect(occurred.status).toBe('occurred');
  });

  it('rejects an invalid transition (resolved -> mitigating)', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', probability: 3, impact: 4 });
    await engine.startMitigation(ORG, risk.id);
    await engine.resolve(ORG, risk.id);
    await expect(engine.startMitigation(ORG, risk.id)).rejects.toBeInstanceOf(InvalidRiskTransitionError);
  });

  it('startMitigation() throws for an unknown risk', async () => {
    const { engine } = setup();
    await expect(engine.startMitigation(ORG, 'missing')).rejects.toBeInstanceOf(ProjectRiskNotFoundError);
  });

  it('findByProject / findByStatus filter correctly', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', probability: 3, impact: 4 });
    await engine.create(ORG, { projectId: 'other-project', title: 'Other', probability: 1, impact: 1 });

    expect(await engine.findByProject(ORG, PROJECT)).toEqual([risk]);
    expect(await engine.findByStatus(ORG, 'identified')).toHaveLength(2);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', probability: 3, impact: 4 });
    expect(await engine.get(ORG, risk.id)).toEqual(risk);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('resolve()/accept()/markOccurred()/update() throw ProjectRiskNotFoundError for an unknown risk', async () => {
    const { engine } = setup();
    await expect(engine.resolve(ORG, 'missing')).rejects.toBeInstanceOf(ProjectRiskNotFoundError);
    await expect(engine.accept(ORG, 'missing')).rejects.toBeInstanceOf(ProjectRiskNotFoundError);
    await expect(engine.markOccurred(ORG, 'missing')).rejects.toBeInstanceOf(ProjectRiskNotFoundError);
    await expect(engine.update(ORG, 'missing', { title: 'x' })).rejects.toBeInstanceOf(ProjectRiskNotFoundError);
  });

  it('risks are isolated per organization', async () => {
    const { engine } = setup();
    await engine.create(ORG, { projectId: PROJECT, title: 'A', probability: 1, impact: 1 });
    await engine.create('org-2', { projectId: PROJECT, title: 'A', probability: 1, impact: 1 });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('a minimal risk (probability 1, impact 1) scores the lowest possible value', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Minor', probability: 1, impact: 1 });
    expect(risk.score).toBe(1);
    expect(computeRiskLevel(risk.score)).toBe('low');
  });

  it('a maximal risk (probability 5, impact 5) scores critical', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Severe', probability: 5, impact: 5 });
    expect(risk.score).toBe(25);
    expect(computeRiskLevel(risk.score)).toBe('critical');
  });

  it('create() accepts optional description and mitigation up front', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', description: 'Key supplier at risk', probability: 2, impact: 3, mitigation: 'Identify backup supplier' });
    expect(risk.description).toBe('Key supplier at risk');
    expect(risk.mitigation).toBe('Identify backup supplier');
  });

  it('update() without any fields leaves probability/impact/score unchanged', async () => {
    const { engine } = setup();
    const risk = await engine.create(ORG, { projectId: PROJECT, title: 'Vendor delay', probability: 3, impact: 4 });
    const updated = await engine.update(ORG, risk.id, {});
    expect(updated.score).toBe(12);
    expect(updated.title).toBe('Vendor delay');
  });
});
