import { describe, expect, it } from 'vitest';
import { createRemediationRepository } from '../src/remediation/repository.impl.js';
import { canTransitionRemediation, createRemediationEngine } from '../src/remediation/service.impl.js';
import { createComplianceEventBus } from '../src/events/index.js';
import { InvalidRemediationTransitionError, RemediationNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createComplianceEventBus()) {
  const repository = createRemediationRepository();
  const engine = createRemediationEngine(repository, eventBus);
  return { repository, engine, eventBus };
}

describe('canTransitionRemediation (pure)', () => {
  it('allows open -> in_progress and open -> cancelled', () => {
    expect(canTransitionRemediation('open', 'in_progress')).toBe(true);
    expect(canTransitionRemediation('open', 'cancelled')).toBe(true);
  });

  it('allows in_progress -> blocked/completed/cancelled', () => {
    expect(canTransitionRemediation('in_progress', 'blocked')).toBe(true);
    expect(canTransitionRemediation('in_progress', 'completed')).toBe(true);
    expect(canTransitionRemediation('in_progress', 'cancelled')).toBe(true);
  });

  it('allows blocked -> in_progress/cancelled', () => {
    expect(canTransitionRemediation('blocked', 'in_progress')).toBe(true);
    expect(canTransitionRemediation('blocked', 'cancelled')).toBe(true);
  });

  it('completed and cancelled are terminal', () => {
    expect(canTransitionRemediation('completed', 'open')).toBe(false);
    expect(canTransitionRemediation('cancelled', 'open')).toBe(false);
  });

  it('rejects open -> blocked directly', () => {
    expect(canTransitionRemediation('open', 'blocked')).toBe(false);
  });
});

describe('createRemediationEngine — createRemediation', () => {
  it('creates an open remediation defaulting gapType to manual', async () => {
    const { engine } = setup();
    const remediation = await engine.createRemediation(ORG, { title: 'Fix control X' });
    expect(remediation.status).toBe('open');
    expect(remediation.gapType).toBe('manual');
  });

  it('accepts frameworkId, referenceId, ownerId, and dueDate at creation', async () => {
    const { engine } = setup();
    const remediation = await engine.createRemediation(ORG, {
      title: 'Fix expired control',
      gapType: 'expired_control',
      frameworkId: 'fw-1',
      referenceId: 'control-1',
      ownerId: 'owner-1',
      dueDate: '2026-12-01T00:00:00.000Z',
    });
    expect(remediation.frameworkId).toBe('fw-1');
    expect(remediation.referenceId).toBe('control-1');
    expect(remediation.ownerId).toBe('owner-1');
    expect(remediation.dueDate).toBe('2026-12-01T00:00:00.000Z');
  });

  it('publishes remediation.created', async () => {
    const eventBus = createComplianceEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('remediation.created', (payload) => (seen = payload));
    const remediation = await engine.createRemediation(ORG, { title: 't' });
    expect(seen).toEqual({ organizationId: ORG, remediationId: remediation.id });
  });
});

describe('createRemediationEngine — assignOwner / setDueDate', () => {
  it('assignOwner() sets the owner', async () => {
    const { engine } = setup();
    const remediation = await engine.createRemediation(ORG, { title: 't' });
    const updated = await engine.assignOwner(ORG, remediation.id, 'owner-2');
    expect(updated.ownerId).toBe('owner-2');
  });

  it('setDueDate() sets the due date', async () => {
    const { engine } = setup();
    const remediation = await engine.createRemediation(ORG, { title: 't' });
    const updated = await engine.setDueDate(ORG, remediation.id, '2027-01-01T00:00:00.000Z');
    expect(updated.dueDate).toBe('2027-01-01T00:00:00.000Z');
  });
});

describe('createRemediationEngine — updateStatus / complete / cancel', () => {
  it('updateStatus() moves through the lifecycle', async () => {
    const { engine } = setup();
    const remediation = await engine.createRemediation(ORG, { title: 't' });
    const inProgress = await engine.updateStatus(ORG, remediation.id, 'in_progress');
    expect(inProgress.status).toBe('in_progress');
    const blocked = await engine.updateStatus(ORG, remediation.id, 'blocked');
    expect(blocked.status).toBe('blocked');
  });

  it('rejects an invalid transition', async () => {
    const { engine } = setup();
    const remediation = await engine.createRemediation(ORG, { title: 't' });
    await expect(engine.updateStatus(ORG, remediation.id, 'blocked')).rejects.toBeInstanceOf(InvalidRemediationTransitionError);
  });

  it('complete() stamps completedAt and publishes remediation.completed', async () => {
    const eventBus = createComplianceEventBus();
    const { engine } = setup(eventBus);
    const remediation = await engine.createRemediation(ORG, { title: 't' });
    await engine.updateStatus(ORG, remediation.id, 'in_progress');
    let seen: unknown;
    eventBus.subscribe('remediation.completed', (payload) => (seen = payload));
    const completed = await engine.complete(ORG, remediation.id);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
    expect(seen).toEqual({ organizationId: ORG, remediationId: remediation.id });
  });

  it('cancel() transitions to cancelled', async () => {
    const { engine } = setup();
    const remediation = await engine.createRemediation(ORG, { title: 't' });
    const cancelled = await engine.cancel(ORG, remediation.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('throws RemediationNotFoundError for an unknown remediation', async () => {
    const { engine } = setup();
    await expect(engine.complete(ORG, 'missing')).rejects.toBeInstanceOf(RemediationNotFoundError);
  });
});

describe('createRemediationEngine — get / org scoping', () => {
  it('get() returns null for an unknown remediation', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const remediation = await engine.createRemediation(ORG, { title: 't' });
    expect(await repository.findById('org-2', remediation.id)).toBeNull();
  });

  it('a blocked remediation can return to in_progress', async () => {
    const { engine } = setup();
    const remediation = await engine.createRemediation(ORG, { title: 't' });
    await engine.updateStatus(ORG, remediation.id, 'in_progress');
    await engine.updateStatus(ORG, remediation.id, 'blocked');
    const resumed = await engine.updateStatus(ORG, remediation.id, 'in_progress');
    expect(resumed.status).toBe('in_progress');
  });

  it('rejects completing directly from open', async () => {
    const { engine } = setup();
    const remediation = await engine.createRemediation(ORG, { title: 't' });
    await expect(engine.complete(ORG, remediation.id)).rejects.toBeInstanceOf(InvalidRemediationTransitionError);
  });
});
