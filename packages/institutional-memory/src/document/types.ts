/** @module document/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  DocumentReferenceId,
  EmployeeId,
  GraphNodeId,
  GraphNodeType,
  OrganizationId,
} from '../shared/identifiers.js';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { MemorySourceLabel } from '../shared/primitives.js';

export type { DocumentReferenceId };

export type DocumentType =
  | 'policy'
  | 'procedure'
  | 'report'
  | 'contract'
  | 'specification'
  | 'drawing'
  | 'manual'
  | 'certificate'
  | 'correspondence'
  | 'other';

export type DocumentReferenceStatus = 'active' | 'archived' | 'superseded';

/** Link to an external or stored document related to institutional memory. */
export interface RelatedEntityRef {
  readonly nodeType: GraphNodeType;
  readonly entityId: Identifier;
  readonly graphNodeId?: GraphNodeId;
}

/** Reference to a document supporting institutional memory. */
export interface DocumentReference extends TenantAuditableEntity<DocumentReferenceId> {
  readonly title: string;
  readonly documentType: DocumentType;
  readonly source: MemorySourceLabel;
  readonly ownerId?: EmployeeId;
  readonly relatedEntities: readonly RelatedEntityRef[];
  readonly externalUri?: string;
  readonly status: DocumentReferenceStatus;
}

export type { OrganizationId };
