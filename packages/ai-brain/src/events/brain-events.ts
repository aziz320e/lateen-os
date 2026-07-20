/** @module events/brain-events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type {
  BrainExecutionPlanId,
  IntentId,
  OrganizationId,
  ReasoningSessionId,
} from '../shared/identifiers.js';
import type { IntentType } from '../intent/types.js';

export type IntentRecognizedEventName = DomainEventName<'intent', 'recognized'>;

export type IntentRecognized = DomainEvent<
  'intent.recognized',
  {
    readonly intentId: IntentId;
    readonly intentType: IntentType;
    readonly summary: string;
    readonly confidenceScore: string;
  }
>;

export type PlanCreatedEventName = DomainEventName<'plan', 'created'>;

export type PlanCreated = DomainEvent<
  'plan.created',
  {
    readonly planId: BrainExecutionPlanId;
    readonly intentId: IntentId;
    readonly summary: string;
  }
>;

export type PlanRejectedEventName = DomainEventName<'plan', 'rejected'>;

export type PlanRejected = DomainEvent<
  'plan.rejected',
  {
    readonly planId: BrainExecutionPlanId;
    readonly intentId: IntentId;
    readonly reason: string;
  }
>;

export type ExecutionRequestedEventName = DomainEventName<'execution', 'requested'>;

export type ExecutionRequested = DomainEvent<
  'execution.requested',
  {
    readonly planId: BrainExecutionPlanId;
    readonly organizationId: OrganizationId;
    readonly requestedBy?: string;
  }
>;

export type ReasoningCompletedEventName = DomainEventName<'reasoning', 'completed'>;

export type ReasoningCompleted = DomainEvent<
  'reasoning.completed',
  {
    readonly sessionId: ReasoningSessionId;
    readonly intentId: IntentId;
    readonly success: boolean;
    readonly stepCount: number;
  }
>;

/** Canonical event names for external subscribers. */
export const BRAIN_EVENT_NAMES = {
  IntentRecognized: 'intent.recognized',
  PlanCreated: 'plan.created',
  PlanRejected: 'plan.rejected',
  ExecutionRequested: 'execution.requested',
  ReasoningCompleted: 'reasoning.completed',
} as const;

/** Union of all AI Brain domain events. */
export type BrainDomainEvent =
  | IntentRecognized
  | PlanCreated
  | PlanRejected
  | ExecutionRequested
  | ReasoningCompleted;
