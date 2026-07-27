import { describe, expect, it, vi } from 'vitest';
import { createApprovalRequestRepository, createGovernanceExceptionRepository } from '../src/approval/repository.impl.js';
import { createApprovalEngine } from '../src/approval/service.impl.js';
import { createDecisionRepository } from '../src/decision/repository.impl.js';
import { createDecisionTrackingService } from '../src/decision/service.impl.js';
import { createGovernanceEventBus } from '../src/events/index.js';
import { ApprovalRequestNotFoundError, InvalidApprovalTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createGovernanceEventBus()) {
  const requestRepository = createApprovalRequestRepository();
  const exceptionRepository = createGovernanceExceptionRepository();
  const decisionRepository = createDecisionRepository();
  const decisions = createDecisionTrackingService(decisionRepository, eventBus);
  const engine = createApprovalEngine(requestRepository, exceptionRepository, decisions, eventBus);
  return { requestRepository, exceptionRepository, decisions, engine, eventBus };
}

describe('createApprovalEngine — requestApproval', () => {
  it('creates a pending request', async () => {
    const { engine } = setup();
    const request = await engine.requestApproval(ORG, { category: 'policy_change', subjectId: 'policy-1' });
    expect(request.status).toBe('pending');
  });

  it('publishes approval.requested', async () => {
    const eventBus = createGovernanceEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('approval.requested', (payload) => (seen = payload));
    const request = await engine.requestApproval(ORG, { category: 'model_approval', subjectId: 'gpt-4' });
    expect(seen).toEqual({ organizationId: ORG, approvalRequestId: request.id, category: 'model_approval' });
  });

  it('supports all five approval categories', async () => {
    const { engine } = setup();
    const categories = ['policy_change', 'security_exception', 'workflow_publication', 'model_approval', 'provider_approval'] as const;
    for (const category of categories) {
      const request = await engine.requestApproval(ORG, { category, subjectId: `${category}-subject` });
      expect(request.category).toBe(category);
    }
  });
});

describe('createApprovalEngine — approve', () => {
  it('approve() transitions to approved and stamps the reviewer/rationale', async () => {
    const { engine } = setup();
    const request = await engine.requestApproval(ORG, { category: 'policy_change', subjectId: 'policy-1' });
    const approved = await engine.approve(ORG, request.id, { reviewerId: 'reviewer-1', rationale: 'looks good' });
    expect(approved.status).toBe('approved');
    expect(approved.reviewerId).toBe('reviewer-1');
    expect(approved.decisionRationale).toBe('looks good');
    expect(approved.decidedAt).toBeDefined();
  });

  it('publishes approval.completed with outcome approved', async () => {
    const eventBus = createGovernanceEventBus();
    const { engine } = setup(eventBus);
    const request = await engine.requestApproval(ORG, { category: 'policy_change', subjectId: 'policy-1' });
    let seen: unknown;
    eventBus.subscribe('approval.completed', (payload) => (seen = payload));
    await engine.approve(ORG, request.id, { reviewerId: 'reviewer-1' });
    expect(seen).toEqual({ organizationId: ORG, approvalRequestId: request.id, outcome: 'approved' });
  });

  it('rejects approving an already-decided request', async () => {
    const { engine } = setup();
    const request = await engine.requestApproval(ORG, { category: 'policy_change', subjectId: 'policy-1' });
    await engine.approve(ORG, request.id, { reviewerId: 'reviewer-1' });
    await expect(engine.approve(ORG, request.id, { reviewerId: 'reviewer-2' })).rejects.toBeInstanceOf(InvalidApprovalTransitionError);
  });

  it('throws ApprovalRequestNotFoundError for an unknown request', async () => {
    const { engine } = setup();
    await expect(engine.approve(ORG, 'missing', { reviewerId: 'r' })).rejects.toBeInstanceOf(ApprovalRequestNotFoundError);
  });

  it('grants a GovernanceException when approving a security_exception request', async () => {
    const { engine } = setup();
    const request = await engine.requestApproval(ORG, { category: 'security_exception', subjectId: 'policy-9' });
    await engine.approve(ORG, request.id, { reviewerId: 'reviewer-1', rationale: 'temporary waiver', expiresAt: '2027-01-01T00:00:00.000Z' });
    const exception = await engine.getExceptionForRequest(ORG, request.id);
    expect(exception).not.toBeNull();
    expect(exception?.grantedBy).toBe('reviewer-1');
    expect(exception?.expiresAt).toBe('2027-01-01T00:00:00.000Z');
  });

  it('does not grant an exception for non security_exception categories', async () => {
    const { engine } = setup();
    const request = await engine.requestApproval(ORG, { category: 'model_approval', subjectId: 'gpt-4' });
    await engine.approve(ORG, request.id, { reviewerId: 'reviewer-1' });
    expect(await engine.getExceptionForRequest(ORG, request.id)).toBeNull();
  });

  it('records a decision through the injected Decision Tracking service', async () => {
    const { engine, decisions } = setup();
    const request = await engine.requestApproval(ORG, { category: 'policy_change', subjectId: 'policy-1' });
    await engine.approve(ORG, request.id, { reviewerId: 'reviewer-1', rationale: 'ok' });
    const history = await decisions.findBySubject(ORG, 'policy-1');
    expect(history).toHaveLength(1);
    expect(history[0]?.outcome).toBe('approved');
    expect(history[0]?.reviewerId).toBe('reviewer-1');
  });
});

describe('createApprovalEngine — reject', () => {
  it('reject() transitions to rejected', async () => {
    const { engine } = setup();
    const request = await engine.requestApproval(ORG, { category: 'workflow_publication', subjectId: 'wf-1' });
    const rejected = await engine.reject(ORG, request.id, { reviewerId: 'reviewer-1', rationale: 'not ready' });
    expect(rejected.status).toBe('rejected');
  });

  it('publishes approval.completed with outcome rejected', async () => {
    const eventBus = createGovernanceEventBus();
    const { engine } = setup(eventBus);
    const request = await engine.requestApproval(ORG, { category: 'workflow_publication', subjectId: 'wf-1' });
    const listener = vi.fn();
    eventBus.subscribe('approval.completed', listener);
    await engine.reject(ORG, request.id, { reviewerId: 'reviewer-1' });
    expect(listener.mock.calls[0]?.[0]).toEqual({ organizationId: ORG, approvalRequestId: request.id, outcome: 'rejected' });
  });

  it('records a rejected decision', async () => {
    const { engine, decisions } = setup();
    const request = await engine.requestApproval(ORG, { category: 'provider_approval', subjectId: 'anthropic' });
    await engine.reject(ORG, request.id, { reviewerId: 'reviewer-2', rationale: 'unsupported region' });
    const history = await decisions.findBySubject(ORG, 'anthropic');
    expect(history[0]?.outcome).toBe('rejected');
  });
});

describe('createApprovalEngine — get / org scoping', () => {
  it('get() returns null for an unknown request', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { engine, requestRepository } = setup();
    const request = await engine.requestApproval(ORG, { category: 'policy_change', subjectId: 'policy-1' });
    expect(await requestRepository.findById('org-2', request.id)).toBeNull();
  });
});
