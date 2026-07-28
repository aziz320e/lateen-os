/**
 * Real Relationships engine — directed links from a document to
 * other documents, projects, customers, employees, knowledge,
 * workflows, and communications. Every linked entity is addressed by
 * an opaque `string` id — this module never fetches or duplicates the
 * target entity itself; resolving a real sibling entity is the
 * Relationship Layer's job (see `relationship-management`).
 *
 * @module relationship/engine.impl
 */
import type { DocumentId } from '../document/types.js';
import { DocumentRelationshipNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { DocumentRelationshipId, OrganizationId } from '../shared/identifiers.js';
import type { DocumentRelationshipRepository } from './repository.js';
import type { DocumentRelationship, RelatedEntityType } from './types.js';

export interface LinkEntityInput {
  readonly documentId: DocumentId;
  readonly relatedEntityType: RelatedEntityType;
  readonly relatedEntityId: string;
  readonly relationType?: string;
}

export interface RelationshipEngine {
  linkEntity(organizationId: OrganizationId, input: LinkEntityInput): Promise<DocumentRelationship>;
  unlinkEntity(organizationId: OrganizationId, relationshipId: DocumentRelationshipId): Promise<void>;
  get(organizationId: OrganizationId, relationshipId: DocumentRelationshipId): Promise<DocumentRelationship | null>;
  list(organizationId: OrganizationId): Promise<readonly DocumentRelationship[]>;
  findByDocument(organizationId: OrganizationId, documentId: DocumentId): Promise<readonly DocumentRelationship[]>;
  findByRelatedEntity(organizationId: OrganizationId, relatedEntityType: RelatedEntityType, relatedEntityId: string): Promise<readonly DocumentRelationship[]>;
}

/** Creates a real {@link RelationshipEngine}. */
export function createRelationshipEngine(repository: DocumentRelationshipRepository, now: () => string = nowIso): RelationshipEngine {
  return {
    async linkEntity(organizationId, input) {
      const timestamp = now();
      const relationship: DocumentRelationship = {
        id: generateId('document-relationship'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        documentId: input.documentId,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
        relationType: input.relationType,
      };
      await repository.save(relationship);
      return relationship;
    },

    async unlinkEntity(organizationId, relationshipId) {
      const relationship = await repository.findById(organizationId, relationshipId);
      if (!relationship) throw new DocumentRelationshipNotFoundError(relationshipId);
      await repository.delete(organizationId, relationshipId);
    },

    async get(organizationId, relationshipId) {
      return repository.findById(organizationId, relationshipId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByDocument(organizationId, documentId) {
      return repository.findByDocument(organizationId, documentId);
    },

    async findByRelatedEntity(organizationId, relatedEntityType, relatedEntityId) {
      return repository.findByRelatedEntity(organizationId, relatedEntityType, relatedEntityId);
    },
  };
}
