/** @module planner/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type PlanEventName =
  | DomainEventName<'plan', 'created'>
  | DomainEventName<'plan', 'refined'>
  | DomainEventName<'plan', 'step_completed'>;

export type PlanDomainEvent =
  | DomainEvent<'plan.created', Record<string, unknown>>
  | DomainEvent<'plan.refined', Record<string, unknown>>
  | DomainEvent<'plan.step_completed', Record<string, unknown>>;
