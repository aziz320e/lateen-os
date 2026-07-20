/**
 * Agent domain events.
 * Event prefix is `ai_agent` per Business DNA schema (module folder: agent).
 *
 * @module agent/events
 */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type AgentEventName =
  | DomainEventName<'ai_agent', 'created'>
  | DomainEventName<'ai_agent', 'activated'>
  | DomainEventName<'ai_agent', 'paused'>
  | DomainEventName<'ai_agent', 'resumed'>
  | DomainEventName<'ai_agent', 'suspended'>
  | DomainEventName<'ai_agent', 'decommissioned'>
  | DomainEventName<'ai_agent', 'archived'>
  | DomainEventName<'ai_agent', 'proactive_run'>
  | DomainEventName<'ai_agent', 'recommendation_generated'>
  | DomainEventName<'ai_agent', 'updated'>;

export type AgentDomainEvent =
  | DomainEvent<'ai_agent.created', { readonly code: string }>
  | DomainEvent<'ai_agent.activated', Record<string, unknown>>
  | DomainEvent<'ai_agent.paused', Record<string, unknown>>
  | DomainEvent<'ai_agent.resumed', Record<string, unknown>>
  | DomainEvent<'ai_agent.suspended', Record<string, unknown>>
  | DomainEvent<'ai_agent.decommissioned', Record<string, unknown>>
  | DomainEvent<'ai_agent.archived', Record<string, unknown>>
  | DomainEvent<'ai_agent.proactive_run', Record<string, unknown>>
  | DomainEvent<'ai_agent.recommendation_generated', Record<string, unknown>>
  | DomainEvent<'ai_agent.updated', Record<string, unknown>>;
