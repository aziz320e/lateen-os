/** @module relationship/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DocumentId } from '../document/types.js';
import type { DocumentRelationshipId } from '../shared/identifiers.js';

export type { DocumentRelationshipId };

/**
 * The kind of entity a document is linked to. `'document'` links two
 * documents to each other (e.g. an amendment referencing its original
 * contract); every other value links to a real sibling-package
 * entity, always addressed by an opaque `string` id.
 */
export type RelatedEntityType = 'document' | 'project' | 'customer' | 'employee' | 'knowledge' | 'workflow' | 'communication';

/** A single, directed link from a document to another entity — this package's own relationship record, never a copy of the target entity. */
export interface DocumentRelationship extends TenantAuditableEntity<DocumentRelationshipId> {
  readonly documentId: DocumentId;
  readonly relatedEntityType: RelatedEntityType;
  readonly relatedEntityId: string;
  readonly relationType?: string;
}
