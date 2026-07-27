/**
 * Real, typed event bus for the Domain Graph runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/domain-graph-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type DomainGraphEventMap = {
  'entity.created': { readonly nodeId: string; readonly organizationId: string; readonly graphId: string; readonly nodeType: string };
  'entity.updated': { readonly nodeId: string; readonly organizationId: string; readonly graphId: string };
  'entity.archived': { readonly nodeId: string; readonly organizationId: string; readonly graphId: string };
  'relationship.created': {
    readonly relationshipId: string;
    readonly organizationId: string;
    readonly graphId: string;
    readonly relationshipType: string;
    readonly sourceNodeId: string;
    readonly targetNodeId: string;
  };
  'relationship.updated': { readonly relationshipId: string; readonly organizationId: string; readonly graphId: string };
  'relationship.deleted': { readonly relationshipId: string; readonly organizationId: string; readonly graphId: string };
  'graph.validated': { readonly graphId: string; readonly organizationId: string; readonly isValid: boolean; readonly issueCount: number };
  'graph.rebuilt': { readonly graphId: string; readonly organizationId: string; readonly entityCount: number; readonly relationshipCount: number };
};

export type DomainGraphEventBus = EventBus<DomainGraphEventMap>;

/** Creates an in-memory {@link DomainGraphEventBus}. */
export function createDomainGraphEventBus(): DomainGraphEventBus {
  return createEventBus<DomainGraphEventMap>();
}
