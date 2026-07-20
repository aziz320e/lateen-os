/** @module document/repository */
import type { GraphNodeType } from '../shared/identifiers.js';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { OrganizationId, DocumentReferenceId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { DocumentReference, DocumentReferenceStatus, DocumentType } from './types.js';

export interface DocumentReferenceRepository extends Repository<
  DocumentReference,
  DocumentReferenceId
> {
  findByType(
    organizationId: OrganizationId,
    documentType: DocumentType,
  ): Promise<readonly DocumentReference[]>;
  findByRelatedEntity(
    organizationId: OrganizationId,
    nodeType: GraphNodeType,
    entityId: Identifier,
  ): Promise<readonly DocumentReference[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: DocumentReferenceStatus,
  ): Promise<readonly DocumentReference[]>;
}
