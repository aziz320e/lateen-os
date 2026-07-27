/** @module events/institutional-memory-events */
import type { DomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';

export type KnowledgeLifecycleEventName =
  | DomainEventName<'knowledge', 'created'>
  | DomainEventName<'knowledge', 'updated'>
  | DomainEventName<'knowledge', 'archived'>
  | DomainEventName<'knowledge', 'restored'>;

export type KnowledgeLifecycleDomainEvent =
  | DomainEvent<
      'knowledge.created',
      { readonly knowledgeEntryId: string; readonly organizationId: string; readonly title: string; readonly knowledgeType: string }
    >
  | DomainEvent<'knowledge.updated', { readonly knowledgeEntryId: string; readonly organizationId: string }>
  | DomainEvent<'knowledge.archived', { readonly knowledgeEntryId: string; readonly organizationId: string }>
  | DomainEvent<'knowledge.restored', { readonly knowledgeEntryId: string; readonly organizationId: string }>;

export type KnowledgeVersionEventName = DomainEventName<'knowledge', 'version.created'>;

export type KnowledgeVersionDomainEvent = DomainEvent<
  'knowledge.version.created',
  { readonly knowledgeEntryId: string; readonly organizationId: string; readonly revisionNumber: number }
>;

export type KnowledgeReviewEventName = DomainEventName<'knowledge', 'review.required'>;

export type KnowledgeReviewDomainEvent = DomainEvent<
  'knowledge.review.required',
  { readonly knowledgeEntryId: string; readonly organizationId: string; readonly reason?: string }
>;

export type KnowledgeExpirationEventName = DomainEventName<'knowledge', 'expired'>;

export type KnowledgeExpirationDomainEvent = DomainEvent<
  'knowledge.expired',
  { readonly knowledgeEntryId: string; readonly organizationId: string }
>;

export type KnowledgeRelationshipEventName = DomainEventName<'knowledge', 'relationship.created'>;

export type KnowledgeRelationshipDomainEvent = DomainEvent<
  'knowledge.relationship.created',
  {
    readonly knowledgeEntryId: string;
    readonly organizationId: string;
    readonly relatedKnowledgeEntryId: string;
    readonly relationshipType: 'related' | 'parent_child' | 'reference';
  }
>;

/** Canonical event names for external subscribers. */
export const INSTITUTIONAL_MEMORY_EVENT_NAMES = {
  KnowledgeCreated: 'knowledge.created',
  KnowledgeUpdated: 'knowledge.updated',
  KnowledgeArchived: 'knowledge.archived',
  KnowledgeRestored: 'knowledge.restored',
  KnowledgeVersionCreated: 'knowledge.version.created',
  KnowledgeReviewRequired: 'knowledge.review.required',
  KnowledgeExpired: 'knowledge.expired',
  KnowledgeRelationshipCreated: 'knowledge.relationship.created',
} as const;

/** Union of all Institutional Memory domain events. */
export type InstitutionalMemoryDomainEvent =
  | KnowledgeLifecycleDomainEvent
  | KnowledgeVersionDomainEvent
  | KnowledgeReviewDomainEvent
  | KnowledgeExpirationDomainEvent
  | KnowledgeRelationshipDomainEvent;
