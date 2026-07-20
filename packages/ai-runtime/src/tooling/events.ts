/** @module tooling/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type ToolEventName =
  | DomainEventName<'tool', 'registered'>
  | DomainEventName<'tool_call', 'requested'>
  | DomainEventName<'tool_call', 'completed'>;

export type ToolDomainEvent =
  | DomainEvent<'tool.registered', Record<string, unknown>>
  | DomainEvent<'tool_call.requested', Record<string, unknown>>
  | DomainEvent<'tool_call.completed', Record<string, unknown>>;
