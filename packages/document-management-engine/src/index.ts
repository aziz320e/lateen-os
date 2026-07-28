/**
 * @lateen-os/document-management-engine — Document Management Engine
 *
 * Document Lifecycle, Folders, Version Control, Metadata, and
 * Relationships for Lateen OS. Real, deterministic, offline
 * implementation — see `runtime.ts`'s
 * `createDocumentManagementRuntime()` for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as document from './document/index.js';
export * as folder from './folder/index.js';
export * as version from './version/index.js';
export * as metadata from './metadata/index.js';
export * as relationship from './relationship/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createDocumentManagementRuntime,
  type DocumentManagementRuntime,
  type DocumentManagementRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { Document, DocumentStatus, DocumentType } from './document/types.js';
export type { Folder, FolderStatus, FolderAccessLevel, FolderPermission } from './folder/types.js';
export type { DocumentVersion } from './version/types.js';
export type { DocumentMetadata } from './metadata/types.js';
export type { DocumentRelationship, RelatedEntityType } from './relationship/types.js';

/** Real lifecycle/service ports. */
export {
  canTransitionDocument,
  type DocumentLifecycleEngine,
  type CreateDocumentInput,
  type UpdateDocumentInput,
} from './document/engine.impl.js';
export {
  canTransitionFolder,
  type FolderManagementEngine,
  type CreateFolderInput,
  type UpdateFolderInput,
  type GrantFolderPermissionInput,
} from './folder/engine.impl.js';
export {
  type VersionControlEngine,
  type CreateDocumentVersionInput,
  type VersionComparison,
} from './version/engine.impl.js';
export {
  isExpired,
  type MetadataEngine,
  type UpsertDocumentMetadataInput,
} from './metadata/engine.impl.js';
export {
  type RelationshipEngine,
  type LinkEntityInput,
} from './relationship/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { DocumentRepository } from './document/repository.js';
export type { FolderRepository } from './folder/repository.js';
export type { DocumentVersionRepository } from './version/repository.js';
export type { DocumentMetadataRepository } from './metadata/repository.js';
export type { DocumentRelationshipRepository } from './relationship/repository.js';

/** Relationship Layer (Business DNA / Institutional Memory / Communication Hub / Project Management Engine / CRM Engine / Customer Success Engine / Workflow Engine / Analytics Engine integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { DocumentManagementQueries } from './queries/document-management-queries.js';

/** Typed event bus. */
export type { DocumentManagementDomainEvent } from './events/document-management-events.js';
export { DOCUMENT_MANAGEMENT_EVENT_NAMES } from './events/document-management-events.js';
export type { DocumentManagementEventBus } from './events/document-management-event-bus.js';
