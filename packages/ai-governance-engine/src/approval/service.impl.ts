/**
 * Real Human Approval Engine — deterministic approval workflows for
 * policy changes, security exceptions, workflow publication, model
 * approval, and provider approval. Every completed decision (approve
 * or reject) is recorded through the injected Decision Tracking
 * service, and approving a `security_exception` request additionally
 * grants a durable {@link GovernanceException}.
 *
 * @module approval/service.impl
 */
import type { DecisionTrackingService } from '../decision/service.impl.js';
import type { GovernanceEventBus } from '../events/governance-event-bus.js';
import { ApprovalRequestNotFoundError, InvalidApprovalTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ApprovalRequestId, GovernanceExceptionId, OrganizationId } from '../shared/identifiers.js';
import type { ApprovalRequestRepository, GovernanceExceptionRepository } from './repository.js';
import type { ApprovalCategory, ApprovalRequest, GovernanceException } from './types.js';

export interface RequestApprovalInput {
  readonly category: ApprovalCategory;
  readonly subjectId: string;
  readonly requestedBy?: string;
  readonly rationale?: string;
}

export interface DecideApprovalInput {
  readonly reviewerId: string;
  readonly rationale?: string;
  /** Only meaningful when approving a `security_exception` request. */
  readonly expiresAt?: string;
}

export interface ApprovalEngine {
  requestApproval(organizationId: OrganizationId, input: RequestApprovalInput): Promise<ApprovalRequest>;
  approve(organizationId: OrganizationId, approvalRequestId: ApprovalRequestId, input: DecideApprovalInput): Promise<ApprovalRequest>;
  reject(organizationId: OrganizationId, approvalRequestId: ApprovalRequestId, input: DecideApprovalInput): Promise<ApprovalRequest>;
  get(organizationId: OrganizationId, approvalRequestId: ApprovalRequestId): Promise<ApprovalRequest | null>;
  getException(organizationId: OrganizationId, exceptionId: GovernanceExceptionId): Promise<GovernanceException | null>;
  getExceptionForRequest(organizationId: OrganizationId, approvalRequestId: ApprovalRequestId): Promise<GovernanceException | null>;
}

/** Creates a real {@link ApprovalEngine} over the approval request and exception repositories. */
export function createApprovalEngine(
  repository: ApprovalRequestRepository,
  exceptionRepository: GovernanceExceptionRepository,
  decisions?: Pick<DecisionTrackingService, 'recordDecision'>,
  eventBus?: GovernanceEventBus,
  now: () => string = nowIso,
): ApprovalEngine {
  async function requireRequest(organizationId: OrganizationId, approvalRequestId: ApprovalRequestId): Promise<ApprovalRequest> {
    const request = await repository.findById(organizationId, approvalRequestId);
    if (!request) throw new ApprovalRequestNotFoundError(approvalRequestId);
    return request;
  }

  async function decide(
    organizationId: OrganizationId,
    approvalRequestId: ApprovalRequestId,
    outcomeStatus: 'approved' | 'rejected',
    input: DecideApprovalInput,
  ): Promise<ApprovalRequest> {
    const request = await requireRequest(organizationId, approvalRequestId);
    if (request.status !== 'pending') {
      throw new InvalidApprovalTransitionError(approvalRequestId, request.status, outcomeStatus);
    }
    const timestamp = now();
    const updated: ApprovalRequest = {
      ...request,
      status: outcomeStatus,
      reviewerId: input.reviewerId,
      decisionRationale: input.rationale,
      decidedAt: timestamp,
      updatedAt: timestamp,
    };
    await repository.save(updated);

    if (outcomeStatus === 'approved' && request.category === 'security_exception') {
      const exception: GovernanceException = {
        id: generateId('governance-exception'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        approvalRequestId,
        subjectId: request.subjectId,
        grantedBy: input.reviewerId,
        rationale: input.rationale,
        expiresAt: input.expiresAt,
      };
      await exceptionRepository.save(exception);
    }

    eventBus?.publish('approval.completed', { organizationId, approvalRequestId, outcome: outcomeStatus });
    await decisions?.recordDecision(organizationId, {
      decisionType: request.category,
      subjectId: request.subjectId,
      outcome: outcomeStatus,
      reviewerId: input.reviewerId,
      rationale: input.rationale,
    });

    return updated;
  }

  return {
    async requestApproval(organizationId, input) {
      const timestamp = now();
      const request: ApprovalRequest = {
        id: generateId('approval-request'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        category: input.category,
        subjectId: input.subjectId,
        requestedBy: input.requestedBy,
        rationale: input.rationale,
        status: 'pending',
      };
      await repository.save(request);
      eventBus?.publish('approval.requested', { organizationId, approvalRequestId: request.id, category: request.category });
      return request;
    },

    approve: (organizationId, approvalRequestId, input) => decide(organizationId, approvalRequestId, 'approved', input),
    reject: (organizationId, approvalRequestId, input) => decide(organizationId, approvalRequestId, 'rejected', input),

    async get(organizationId, approvalRequestId) {
      return repository.findById(organizationId, approvalRequestId);
    },

    async getException(organizationId, exceptionId) {
      return exceptionRepository.findById(organizationId, exceptionId);
    },

    async getExceptionForRequest(organizationId, approvalRequestId) {
      return exceptionRepository.findByApprovalRequestId(organizationId, approvalRequestId);
    },
  };
}
