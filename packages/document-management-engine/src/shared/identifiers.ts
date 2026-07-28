/**
 * Identifier types for the Document Management Engine bounded
 * context.
 *
 * Sibling-owned entities referenced by this package (CRM customers,
 * project management projects, customer success records, HR
 * employees, institutional memory knowledge, workflow instances,
 * communication hub messages) are addressed by plain `string` foreign
 * keys — this package never redefines another package's identifier
 * namespace.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { OrganizationId } from '@lateen-os/business-dna';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Document Lifecycle. */
export type DocumentId = Identifier;

/** Folders. */
export type FolderId = Identifier;

/** Version Control. */
export type DocumentVersionId = Identifier;

/** Metadata. */
export type DocumentMetadataId = Identifier;

/** Relationships. */
export type DocumentRelationshipId = Identifier;
