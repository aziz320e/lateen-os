/**
 * Document Management Runtime — the package's composition root.
 * Wires every real in-memory repository and service together:
 * Document Lifecycle, Folders, Version Control (composed with
 * Document Lifecycle for the current-version pointer), Metadata,
 * Relationships, the Relationship Layer (the only integration point
 * with Business DNA, Institutional Memory, Communication Hub, Project
 * Management Engine, CRM Engine, Customer Success Engine, Workflow
 * Engine, and Analytics Engine), the query layer, and the typed event
 * bus.
 *
 * Repositories are created here and injected into services — they
 * are never part of the returned {@link DocumentManagementRuntime}
 * surface.
 *
 * @module runtime
 */
import { createDocumentLifecycleEngine, createDocumentRepository, type DocumentLifecycleEngine } from './document/index.js';
import { createDocumentManagementEventBus, type DocumentManagementEventBus } from './events/index.js';
import { createFolderManagementEngine, createFolderRepository, type FolderManagementEngine } from './folder/index.js';
import { createDocumentMetadataRepository, createMetadataEngine, type MetadataEngine } from './metadata/index.js';
import { createDocumentManagementQueries, type DocumentManagementQueries } from './queries/index.js';
import { createRelationshipEngine, createDocumentRelationshipRepository, type RelationshipEngine } from './relationship/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { nowIso } from './shared/id.js';
import { createDocumentVersionRepository, createVersionControlEngine, type VersionControlEngine } from './version/index.js';

export interface DocumentManagementRuntimeDeps {
  readonly eventBus?: DocumentManagementEventBus;
  readonly now?: () => string;
  readonly businessDna?: RelationshipManagementDeps['businessDna'];
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
  readonly projects?: RelationshipManagementDeps['projects'];
  readonly crm?: RelationshipManagementDeps['crm'];
  readonly customerSuccess?: RelationshipManagementDeps['customerSuccess'];
  readonly workflow?: RelationshipManagementDeps['workflow'];
  readonly analytics?: RelationshipManagementDeps['analytics'];
}

export interface DocumentManagementRuntime {
  readonly documents: DocumentLifecycleEngine;
  readonly folders: FolderManagementEngine;
  readonly versions: VersionControlEngine;
  readonly metadata: MetadataEngine;
  readonly relationships: RelationshipEngine;
  readonly relationshipManagement: RelationshipManagement;
  readonly queries: DocumentManagementQueries;
  /** Typed event bus — subscribe to document/version/metadata lifecycle events. */
  readonly events: DocumentManagementEventBus;
}

/** Creates a real, in-memory {@link DocumentManagementRuntime}. */
export function createDocumentManagementRuntime(deps: DocumentManagementRuntimeDeps = {}): DocumentManagementRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createDocumentManagementEventBus();

  const documentRepository = createDocumentRepository();
  const folderRepository = createFolderRepository();
  const versionRepository = createDocumentVersionRepository();
  const metadataRepository = createDocumentMetadataRepository();
  const relationshipRepository = createDocumentRelationshipRepository();

  const documents = createDocumentLifecycleEngine(documentRepository, eventBus, now);
  const folders = createFolderManagementEngine(folderRepository, now);
  const versions = createVersionControlEngine(versionRepository, documents, eventBus, now);
  const metadata = createMetadataEngine(metadataRepository, eventBus, now);
  const relationships = createRelationshipEngine(relationshipRepository, now);

  const relationshipManagement = createRelationshipManagement({
    businessDna: deps.businessDna,
    institutionalMemory: deps.institutionalMemory,
    communicationHub: deps.communicationHub,
    projects: deps.projects,
    crm: deps.crm,
    customerSuccess: deps.customerSuccess,
    workflow: deps.workflow,
    analytics: deps.analytics,
  });

  const queries = createDocumentManagementQueries({
    documentRepository,
    folderRepository,
    versionRepository,
    metadataRepository,
    relationshipRepository,
  });

  return {
    documents,
    folders,
    versions,
    metadata,
    relationships,
    relationshipManagement,
    queries,
    events: eventBus,
  };
}
