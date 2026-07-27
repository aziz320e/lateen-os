/**
 * Real Decision Tracking service — an append-only, immutable audit
 * history of governance decisions (approvals and rejections), each
 * carrying its reviewer, timestamp, and rationale. No update or delete
 * method is exposed by design: history is immutable.
 *
 * @module decision/service.impl
 */
import type { GovernanceEventBus } from '../events/governance-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { DecisionRepository } from './repository.js';
import type { Decision, DecisionOutcome } from './types.js';

export interface RecordDecisionInput {
  readonly decisionType: string;
  readonly subjectId: string;
  readonly outcome: DecisionOutcome;
  readonly reviewerId: string;
  readonly rationale?: string;
}

export interface DecisionTrackingService {
  recordDecision(organizationId: OrganizationId, input: RecordDecisionInput): Promise<Decision>;
  findBySubject(organizationId: OrganizationId, subjectId: string): Promise<readonly Decision[]>;
  findByReviewer(organizationId: OrganizationId, reviewerId: string): Promise<readonly Decision[]>;
  /** The full, immutable decision history, oldest first. */
  getHistory(organizationId: OrganizationId): Promise<readonly Decision[]>;
}

/** Creates a real {@link DecisionTrackingService} backed by a {@link DecisionRepository}. */
export function createDecisionTrackingService(
  repository: DecisionRepository,
  eventBus?: GovernanceEventBus,
  now: () => string = nowIso,
): DecisionTrackingService {
  return {
    async recordDecision(organizationId, input) {
      const timestamp = now();
      const decision: Decision = {
        id: generateId('decision'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        decisionType: input.decisionType,
        subjectId: input.subjectId,
        outcome: input.outcome,
        reviewerId: input.reviewerId,
        rationale: input.rationale,
        occurredAt: timestamp,
      };
      await repository.save(decision);
      eventBus?.publish('governance.audit.created', { organizationId, decisionId: decision.id, decisionType: decision.decisionType });
      return decision;
    },

    async findBySubject(organizationId, subjectId) {
      return repository.findBySubject(organizationId, subjectId);
    },

    async findByReviewer(organizationId, reviewerId) {
      return repository.findByReviewer(organizationId, reviewerId);
    },

    async getHistory(organizationId) {
      const all = await repository.findAll(organizationId);
      return [...all].sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : a.occurredAt > b.occurredAt ? 1 : 0));
    },
  };
}
