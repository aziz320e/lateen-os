import { describe, expect, it } from 'vitest';
import { createDecisionRepository } from '../src/decision/repository.impl.js';
import { createDecisionTrackingService } from '../src/decision/service.impl.js';
import { createGovernanceEventBus } from '../src/events/index.js';

const ORG = 'org-1';

function setup(eventBus = createGovernanceEventBus()) {
  const repository = createDecisionRepository();
  const service = createDecisionTrackingService(repository, eventBus);
  return { repository, service, eventBus };
}

describe('createDecisionTrackingService — recordDecision', () => {
  it('records a decision with reviewer, rationale, and timestamp', async () => {
    const { service } = setup();
    const decision = await service.recordDecision(ORG, {
      decisionType: 'policy_change',
      subjectId: 'policy-1',
      outcome: 'approved',
      reviewerId: 'reviewer-1',
      rationale: 'meets standards',
    });
    expect(decision.outcome).toBe('approved');
    expect(decision.reviewerId).toBe('reviewer-1');
    expect(decision.rationale).toBe('meets standards');
    expect(decision.occurredAt).toBeDefined();
  });

  it('publishes governance.audit.created', async () => {
    const eventBus = createGovernanceEventBus();
    const { service } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('governance.audit.created', (payload) => (seen = payload));
    const decision = await service.recordDecision(ORG, {
      decisionType: 'model_approval',
      subjectId: 'gpt-4',
      outcome: 'rejected',
      reviewerId: 'reviewer-2',
    });
    expect(seen).toEqual({ organizationId: ORG, decisionId: decision.id, decisionType: 'model_approval' });
  });
});

describe('createDecisionTrackingService — findBySubject / findByReviewer', () => {
  it('findBySubject() filters correctly', async () => {
    const { service } = setup();
    await service.recordDecision(ORG, { decisionType: 't', subjectId: 'subject-1', outcome: 'approved', reviewerId: 'r1' });
    await service.recordDecision(ORG, { decisionType: 't', subjectId: 'subject-2', outcome: 'approved', reviewerId: 'r1' });
    const results = await service.findBySubject(ORG, 'subject-1');
    expect(results).toHaveLength(1);
  });

  it('findByReviewer() filters correctly', async () => {
    const { service } = setup();
    await service.recordDecision(ORG, { decisionType: 't', subjectId: 's1', outcome: 'approved', reviewerId: 'r1' });
    await service.recordDecision(ORG, { decisionType: 't', subjectId: 's2', outcome: 'rejected', reviewerId: 'r2' });
    const results = await service.findByReviewer(ORG, 'r2');
    expect(results).toHaveLength(1);
    expect(results[0]?.outcome).toBe('rejected');
  });

  it('findBySubject() returns an empty list for a subject with no decisions', async () => {
    const { service } = setup();
    expect(await service.findBySubject(ORG, 'unknown-subject')).toEqual([]);
  });
});

describe('createDecisionTrackingService — getHistory (immutable audit history)', () => {
  it('returns every decision sorted oldest first', async () => {
    const { service } = setup();
    await service.recordDecision(ORG, { decisionType: 't', subjectId: 's1', outcome: 'approved', reviewerId: 'r1' });
    await service.recordDecision(ORG, { decisionType: 't', subjectId: 's2', outcome: 'rejected', reviewerId: 'r1' });
    const history = await service.getHistory(ORG);
    expect(history).toHaveLength(2);
    expect(history[0]?.occurredAt <= history[1]!.occurredAt).toBe(true);
  });

  it('exposes no update or delete method — the service surface is append-only', () => {
    const { service } = setup();
    expect((service as Record<string, unknown>)['update']).toBeUndefined();
    expect((service as Record<string, unknown>)['delete']).toBeUndefined();
  });

  it('is organization-scoped', async () => {
    const { service } = setup();
    await service.recordDecision(ORG, { decisionType: 't', subjectId: 's1', outcome: 'approved', reviewerId: 'r1' });
    const history = await service.getHistory('org-2');
    expect(history).toHaveLength(0);
  });
});
