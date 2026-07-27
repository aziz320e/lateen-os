/**
 * Real, typed event bus for the Institutional Memory runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/institutional-memory-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type InstitutionalMemoryEventMap = {
  'knowledge.created': { readonly knowledgeEntryId: string; readonly organizationId: string; readonly title: string; readonly knowledgeType: string };
  'knowledge.updated': { readonly knowledgeEntryId: string; readonly organizationId: string };
  'knowledge.archived': { readonly knowledgeEntryId: string; readonly organizationId: string };
  'knowledge.restored': { readonly knowledgeEntryId: string; readonly organizationId: string };
  'knowledge.version.created': { readonly knowledgeEntryId: string; readonly organizationId: string; readonly revisionNumber: number };
  'knowledge.review.required': { readonly knowledgeEntryId: string; readonly organizationId: string; readonly reason?: string };
  'knowledge.expired': { readonly knowledgeEntryId: string; readonly organizationId: string };
  'knowledge.relationship.created': {
    readonly knowledgeEntryId: string;
    readonly organizationId: string;
    readonly relatedKnowledgeEntryId: string;
    readonly relationshipType: 'related' | 'parent_child' | 'reference';
  };
};

export type InstitutionalMemoryEventBus = EventBus<InstitutionalMemoryEventMap>;

/** Creates an in-memory {@link InstitutionalMemoryEventBus}. */
export function createInstitutionalMemoryEventBus(): InstitutionalMemoryEventBus {
  return createEventBus<InstitutionalMemoryEventMap>();
}
