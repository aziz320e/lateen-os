/**
 * Real, typed event bus for the Document Management Engine runtime,
 * built on shared-kernel's generic {@link createEventBus}.
 *
 * @module events/document-management-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type DocumentManagementEventMap = {
  'document.created': { readonly organizationId: string; readonly documentId: string; readonly title: string };
  'document.updated': { readonly organizationId: string; readonly documentId: string };
  'document.reviewed': { readonly organizationId: string; readonly documentId: string };
  'document.approved': { readonly organizationId: string; readonly documentId: string };
  'document.published': { readonly organizationId: string; readonly documentId: string };
  'document.archived': { readonly organizationId: string; readonly documentId: string };
  'document.restored': { readonly organizationId: string; readonly documentId: string };
  'document.version.created': { readonly organizationId: string; readonly documentId: string; readonly versionId: string; readonly versionNumber: number };
  'document.expired': { readonly organizationId: string; readonly documentId: string };
  'document.deleted': { readonly organizationId: string; readonly documentId: string };
};

export type DocumentManagementEventBus = EventBus<DocumentManagementEventMap>;

/** Creates an in-memory {@link DocumentManagementEventBus}. */
export function createDocumentManagementEventBus(): DocumentManagementEventBus {
  return createEventBus<DocumentManagementEventMap>();
}
