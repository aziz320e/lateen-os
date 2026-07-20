/** @module knowledge-mining/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type KnowledgeFindingEventName =
  | DomainEventName<'knowledge_finding', 'mined'>
  | DomainEventName<'knowledge_finding', 'validated'>
  | DomainEventName<'knowledge_finding', 'archived'>;

export type KnowledgeFindingDomainEvent =
  | DomainEvent<'knowledge_finding.mined', { readonly title: string }>
  | DomainEvent<'knowledge_finding.validated', Record<string, unknown>>
  | DomainEvent<'knowledge_finding.archived', Record<string, unknown>>;
