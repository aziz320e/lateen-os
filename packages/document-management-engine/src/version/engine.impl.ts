/**
 * Real Version Control engine — immutable content snapshots, a
 * deterministic comparison between any two versions, and a pointer
 * restore (never deleting a later version). Composed intra-package
 * with the Document Lifecycle engine's `setCurrentVersionNumber()`,
 * mirroring the Inventory Engine's movement/stock composition.
 *
 * @module version/engine.impl
 */
import type { DocumentLifecycleEngine } from '../document/engine.impl.js';
import type { Document, DocumentId } from '../document/types.js';
import type { DocumentManagementEventBus } from '../events/document-management-event-bus.js';
import { DocumentNotFoundError, DocumentVersionNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { DocumentVersionRepository } from './repository.js';
import type { DocumentVersion } from './types.js';

export interface CreateDocumentVersionInput {
  readonly documentId: DocumentId;
  readonly contentRef: string;
  readonly changeNotes?: string;
  readonly createdBy?: string;
}

export interface VersionComparison {
  readonly versionNumberA: number;
  readonly versionNumberB: number;
  readonly contentRefA: string;
  readonly contentRefB: string;
  readonly changed: boolean;
  readonly changeNotesA?: string;
  readonly changeNotesB?: string;
}

export interface VersionControlEngine {
  createVersion(organizationId: OrganizationId, input: CreateDocumentVersionInput): Promise<DocumentVersion>;
  compareVersions(organizationId: OrganizationId, documentId: DocumentId, versionNumberA: number, versionNumberB: number): Promise<VersionComparison>;
  restoreVersion(organizationId: OrganizationId, documentId: DocumentId, versionNumber: number): Promise<Document>;
  get(organizationId: OrganizationId, versionId: string): Promise<DocumentVersion | null>;
  list(organizationId: OrganizationId): Promise<readonly DocumentVersion[]>;
  findByDocument(organizationId: OrganizationId, documentId: DocumentId): Promise<readonly DocumentVersion[]>;
}

/** Creates a real {@link VersionControlEngine}. */
export function createVersionControlEngine(
  repository: DocumentVersionRepository,
  documents: Pick<DocumentLifecycleEngine, 'get' | 'setCurrentVersionNumber'>,
  eventBus?: DocumentManagementEventBus,
  now: () => string = nowIso,
): VersionControlEngine {
  async function requireVersion(organizationId: OrganizationId, documentId: DocumentId, versionNumber: number): Promise<DocumentVersion> {
    const version = await repository.findByDocumentAndVersionNumber(organizationId, documentId, versionNumber);
    if (!version) throw new DocumentVersionNotFoundError(`${documentId}@${versionNumber}`);
    return version;
  }

  return {
    async createVersion(organizationId, input) {
      const document = await documents.get(organizationId, input.documentId);
      if (!document) throw new DocumentNotFoundError(input.documentId);

      const existing = await repository.findByDocument(organizationId, input.documentId);
      const nextVersionNumber = existing.reduce((max, version) => Math.max(max, version.versionNumber), 0) + 1;

      const timestamp = now();
      const version: DocumentVersion = {
        id: generateId('document-version'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        documentId: input.documentId,
        versionNumber: nextVersionNumber,
        contentRef: input.contentRef,
        changeNotes: input.changeNotes,
        createdBy: input.createdBy,
      };
      await repository.save(version);
      await documents.setCurrentVersionNumber(organizationId, input.documentId, nextVersionNumber);
      eventBus?.publish('document.version.created', { organizationId, documentId: input.documentId, versionId: version.id, versionNumber: nextVersionNumber });
      return version;
    },

    async compareVersions(organizationId, documentId, versionNumberA, versionNumberB) {
      const [a, b] = await Promise.all([
        requireVersion(organizationId, documentId, versionNumberA),
        requireVersion(organizationId, documentId, versionNumberB),
      ]);
      return {
        versionNumberA: a.versionNumber,
        versionNumberB: b.versionNumber,
        contentRefA: a.contentRef,
        contentRefB: b.contentRef,
        changed: a.contentRef !== b.contentRef,
        changeNotesA: a.changeNotes,
        changeNotesB: b.changeNotes,
      };
    },

    async restoreVersion(organizationId, documentId, versionNumber) {
      await requireVersion(organizationId, documentId, versionNumber);
      return documents.setCurrentVersionNumber(organizationId, documentId, versionNumber);
    },

    async get(organizationId, versionId) {
      return repository.findById(organizationId, versionId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByDocument(organizationId, documentId) {
      return repository.findByDocument(organizationId, documentId);
    },
  };
}
