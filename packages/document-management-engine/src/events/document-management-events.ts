/** @module events/document-management-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type DocumentCreatedEvent = DomainEvent<
  'document.created',
  { readonly organizationId: string; readonly documentId: string; readonly title: string }
>;

export type DocumentUpdatedEvent = DomainEvent<
  'document.updated',
  { readonly organizationId: string; readonly documentId: string }
>;

export type DocumentReviewedEvent = DomainEvent<
  'document.reviewed',
  { readonly organizationId: string; readonly documentId: string }
>;

export type DocumentApprovedEvent = DomainEvent<
  'document.approved',
  { readonly organizationId: string; readonly documentId: string }
>;

export type DocumentPublishedEvent = DomainEvent<
  'document.published',
  { readonly organizationId: string; readonly documentId: string }
>;

export type DocumentArchivedEvent = DomainEvent<
  'document.archived',
  { readonly organizationId: string; readonly documentId: string }
>;

export type DocumentRestoredEvent = DomainEvent<
  'document.restored',
  { readonly organizationId: string; readonly documentId: string }
>;

export type DocumentVersionCreatedEvent = DomainEvent<
  'document.version.created',
  { readonly organizationId: string; readonly documentId: string; readonly versionId: string; readonly versionNumber: number }
>;

export type DocumentExpiredEvent = DomainEvent<
  'document.expired',
  { readonly organizationId: string; readonly documentId: string }
>;

export type DocumentDeletedEvent = DomainEvent<
  'document.deleted',
  { readonly organizationId: string; readonly documentId: string }
>;

/** Canonical event names for external subscribers. */
export const DOCUMENT_MANAGEMENT_EVENT_NAMES = {
  DocumentCreated: 'document.created',
  DocumentUpdated: 'document.updated',
  DocumentReviewed: 'document.reviewed',
  DocumentApproved: 'document.approved',
  DocumentPublished: 'document.published',
  DocumentArchived: 'document.archived',
  DocumentRestored: 'document.restored',
  DocumentVersionCreated: 'document.version.created',
  DocumentExpired: 'document.expired',
  DocumentDeleted: 'document.deleted',
} as const;

/** Union of all Document Management Engine domain events. */
export type DocumentManagementDomainEvent =
  | DocumentCreatedEvent
  | DocumentUpdatedEvent
  | DocumentReviewedEvent
  | DocumentApprovedEvent
  | DocumentPublishedEvent
  | DocumentArchivedEvent
  | DocumentRestoredEvent
  | DocumentVersionCreatedEvent
  | DocumentExpiredEvent
  | DocumentDeletedEvent;
