/** @module approval/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { DecisionId } from '../shared/identifiers.js';

export type ApprovalFlowEventName =
  | DomainEventName<'approval_flow', 'started'>
  | DomainEventName<'approval_flow', 'step_approved'>
  | DomainEventName<'approval_flow', 'step_rejected'>
  | DomainEventName<'approval_flow', 'completed'>
  | DomainEventName<'approval_flow', 'cancelled'>;

export type ApprovalFlowDomainEvent =
  | DomainEvent<'approval_flow.started', { readonly decisionId: DecisionId }>
  | DomainEvent<'approval_flow.step_approved', { readonly stepId: string }>
  | DomainEvent<'approval_flow.step_rejected', { readonly stepId: string }>
  | DomainEvent<'approval_flow.completed', Record<string, unknown>>
  | DomainEvent<'approval_flow.cancelled', Record<string, unknown>>;
