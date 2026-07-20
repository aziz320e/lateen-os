/** @module registry/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type AgentRegistryEventName =
  | DomainEventName<'agent_registry', 'agent_registered'>
  | DomainEventName<'agent_registry', 'agent_deregistered'>
  | DomainEventName<'agent_registry', 'updated'>;

export type AgentRegistryDomainEvent =
  | DomainEvent<'agent_registry.agent_registered', { readonly runtimeAgentId: string }>
  | DomainEvent<'agent_registry.agent_deregistered', { readonly runtimeAgentId: string }>
  | DomainEvent<'agent_registry.updated', Record<string, unknown>>;
