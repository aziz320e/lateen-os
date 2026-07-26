import { describe, expect, it } from 'vitest';
import { createDelegationPolicyRepository, createDelegationRequestRepository } from '../src/delegation/repository.impl.js';
import { createDelegationService } from '../src/delegation/service.impl.js';
import { DelegationDepthExceededError } from '../src/shared/errors.js';

const ORG = 'org-1';
const MISSION = 'mission-1';

describe('DelegationService — depth enforcement', () => {
  it('allows delegation within the policy maxDepth', async () => {
    const requestRepository = createDelegationRequestRepository();
    const policyRepository = createDelegationPolicyRepository();
    const service = createDelegationService(requestRepository, policyRepository);

    const policy = await service.createPolicy({
      organizationId: ORG,
      missionId: MISSION,
      name: 'default',
      sourceRole: 'ceo_ai',
      targetRoles: ['sales_ai', 'finance_ai'],
      maxDepth: 2,
      requiresLeaderApproval: false,
    });

    const first = await service.request({
      organizationId: ORG,
      missionId: MISSION,
      sourceWorkerId: 'ceo-worker',
      targetWorkerId: 'sales-worker',
      objective: 'Close Q3 deals',
      rationale: 'Sales specialization',
      policyId: policy.id,
    });
    await service.respond(ORG, first.id, true, 'sales-worker');

    const second = await service.request({
      organizationId: ORG,
      missionId: MISSION,
      sourceWorkerId: 'sales-worker',
      targetWorkerId: 'finance-worker',
      objective: 'Validate pricing',
      rationale: 'Finance specialization',
      policyId: policy.id,
    });
    expect(second.status).toBe('requested');

    expect(await service.depthOf(ORG, MISSION, 'finance-worker')).toBe(0); // not yet accepted
    await service.respond(ORG, second.id, true, 'finance-worker');
    expect(await service.depthOf(ORG, MISSION, 'finance-worker')).toBe(2);
  });

  it('rejects a delegation that would exceed the policy maxDepth', async () => {
    const requestRepository = createDelegationRequestRepository();
    const policyRepository = createDelegationPolicyRepository();
    const service = createDelegationService(requestRepository, policyRepository);

    const policy = await service.createPolicy({
      organizationId: ORG,
      missionId: MISSION,
      name: 'shallow',
      sourceRole: 'ceo_ai',
      targetRoles: ['sales_ai'],
      maxDepth: 1,
      requiresLeaderApproval: false,
    });

    const first = await service.request({
      organizationId: ORG,
      missionId: MISSION,
      sourceWorkerId: 'ceo-worker',
      targetWorkerId: 'sales-worker',
      objective: 'Close deals',
      rationale: 'Sales specialization',
      policyId: policy.id,
    });
    await service.respond(ORG, first.id, true, 'sales-worker');

    await expect(
      service.request({
        organizationId: ORG,
        missionId: MISSION,
        sourceWorkerId: 'sales-worker',
        targetWorkerId: 'finance-worker',
        objective: 'Validate pricing',
        rationale: 'Too deep',
        policyId: policy.id,
      }),
    ).rejects.toBeInstanceOf(DelegationDepthExceededError);
  });

  it('does not enforce depth when no policyId is given', async () => {
    const requestRepository = createDelegationRequestRepository();
    const policyRepository = createDelegationPolicyRepository();
    const service = createDelegationService(requestRepository, policyRepository);

    const request = await service.request({
      organizationId: ORG,
      missionId: MISSION,
      sourceWorkerId: 'ceo-worker',
      targetWorkerId: 'sales-worker',
      objective: 'Close deals',
      rationale: 'No policy attached',
    });
    expect(request.status).toBe('requested');
  });
});
