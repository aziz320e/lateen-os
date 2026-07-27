/** @module events/domain-graph-events */
import type { DomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';

export type EntityEventName =
  | DomainEventName<'entity', 'created'>
  | DomainEventName<'entity', 'updated'>
  | DomainEventName<'entity', 'archived'>;

export type EntityDomainEvent =
  | DomainEvent<
      'entity.created',
      { readonly nodeId: string; readonly organizationId: string; readonly graphId: string; readonly nodeType: string }
    >
  | DomainEvent<'entity.updated', { readonly nodeId: string; readonly organizationId: string; readonly graphId: string }>
  | DomainEvent<'entity.archived', { readonly nodeId: string; readonly organizationId: string; readonly graphId: string }>;

export type RelationshipEventName =
  | DomainEventName<'relationship', 'created'>
  | DomainEventName<'relationship', 'updated'>
  | DomainEventName<'relationship', 'deleted'>;

export type RelationshipDomainEvent =
  | DomainEvent<
      'relationship.created',
      {
        readonly relationshipId: string;
        readonly organizationId: string;
        readonly graphId: string;
        readonly relationshipType: string;
        readonly sourceNodeId: string;
        readonly targetNodeId: string;
      }
    >
  | DomainEvent<'relationship.updated', { readonly relationshipId: string; readonly organizationId: string; readonly graphId: string }>
  | DomainEvent<'relationship.deleted', { readonly relationshipId: string; readonly organizationId: string; readonly graphId: string }>;

export type GraphValidatedEventName = DomainEventName<'graph', 'validated'>;

export type GraphValidatedDomainEvent = DomainEvent<
  'graph.validated',
  { readonly graphId: string; readonly organizationId: string; readonly isValid: boolean; readonly issueCount: number }
>;

export type GraphRebuiltEventName = DomainEventName<'graph', 'rebuilt'>;

export type GraphRebuiltDomainEvent = DomainEvent<
  'graph.rebuilt',
  { readonly graphId: string; readonly organizationId: string; readonly entityCount: number; readonly relationshipCount: number }
>;

/** Canonical event names for external subscribers. */
export const DOMAIN_GRAPH_EVENT_NAMES = {
  EntityCreated: 'entity.created',
  EntityUpdated: 'entity.updated',
  EntityArchived: 'entity.archived',
  RelationshipCreated: 'relationship.created',
  RelationshipUpdated: 'relationship.updated',
  RelationshipDeleted: 'relationship.deleted',
  GraphValidated: 'graph.validated',
  GraphRebuilt: 'graph.rebuilt',
} as const;

/** Union of all Domain Graph domain events. */
export type DomainGraphDomainEvent =
  | EntityDomainEvent
  | RelationshipDomainEvent
  | GraphValidatedDomainEvent
  | GraphRebuiltDomainEvent;
