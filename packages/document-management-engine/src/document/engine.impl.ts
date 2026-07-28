/**
 * Real Document Lifecycle engine — guarded
 * draft/review/approved/published/archived lifecycle, plus a distinct
 * `restore()` and a guarded hard `delete()`.
 *
 * @module document/engine.impl
 */
import type { DocumentManagementEventBus } from '../events/document-management-event-bus.js';
import { DocumentNotFoundError, InvalidDocumentTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { DocumentId, FolderId, OrganizationId } from '../shared/identifiers.js';
import type { DocumentRepository } from './repository.js';
import type { Document, DocumentStatus, DocumentType } from './types.js';

const DOCUMENT_TRANSITIONS: Readonly<Record<DocumentStatus, readonly DocumentStatus[]>> = {
  draft: ['review', 'archived'],
  review: ['approved', 'draft', 'archived'],
  approved: ['published', 'archived'],
  published: ['archived'],
  // Archived is a dead end for ordinary transitions — restore() is a distinct
  // operation (below) that returns a document to its pre-archive status.
  archived: [],
};

/** Whether a document may transition from one status to another via the ordinary lifecycle (not `restore()`). */
export function canTransitionDocument(from: DocumentStatus, to: DocumentStatus): boolean {
  return DOCUMENT_TRANSITIONS[from].includes(to);
}

export interface CreateDocumentInput {
  readonly title: string;
  readonly documentType: DocumentType;
  readonly folderId?: FolderId;
  readonly ownerId?: string;
}

export interface UpdateDocumentInput {
  readonly title?: string;
  readonly folderId?: FolderId;
  readonly ownerId?: string;
}

export interface DocumentLifecycleEngine {
  create(organizationId: OrganizationId, input: CreateDocumentInput): Promise<Document>;
  update(organizationId: OrganizationId, documentId: DocumentId, input: UpdateDocumentInput): Promise<Document>;
  submitForReview(organizationId: OrganizationId, documentId: DocumentId): Promise<Document>;
  returnToDraft(organizationId: OrganizationId, documentId: DocumentId): Promise<Document>;
  approve(organizationId: OrganizationId, documentId: DocumentId): Promise<Document>;
  publish(organizationId: OrganizationId, documentId: DocumentId): Promise<Document>;
  archive(organizationId: OrganizationId, documentId: DocumentId): Promise<Document>;
  restore(organizationId: OrganizationId, documentId: DocumentId): Promise<Document>;
  /** Permanently removes a document. Only permitted once it has been archived. */
  delete(organizationId: OrganizationId, documentId: DocumentId): Promise<void>;
  get(organizationId: OrganizationId, documentId: DocumentId): Promise<Document | null>;
  list(organizationId: OrganizationId): Promise<readonly Document[]>;
  findByFolder(organizationId: OrganizationId, folderId: FolderId): Promise<readonly Document[]>;
  findByType(organizationId: OrganizationId, documentType: DocumentType): Promise<readonly Document[]>;
  findByStatus(organizationId: OrganizationId, status: DocumentStatus): Promise<readonly Document[]>;
  findByOwner(organizationId: OrganizationId, ownerId: string): Promise<readonly Document[]>;
  /** Internal — bumps `currentVersionNumber`, used only by the Version Control module's intra-package composition. */
  setCurrentVersionNumber(organizationId: OrganizationId, documentId: DocumentId, versionNumber: number): Promise<Document>;
}

/** Creates a real {@link DocumentLifecycleEngine}. */
export function createDocumentLifecycleEngine(
  repository: DocumentRepository,
  eventBus?: DocumentManagementEventBus,
  now: () => string = nowIso,
): DocumentLifecycleEngine {
  async function requireDocument(organizationId: OrganizationId, documentId: DocumentId): Promise<Document> {
    const document = await repository.findById(organizationId, documentId);
    if (!document) throw new DocumentNotFoundError(documentId);
    return document;
  }

  async function transition(organizationId: OrganizationId, documentId: DocumentId, to: DocumentStatus): Promise<Document> {
    const document = await requireDocument(organizationId, documentId);
    if (!canTransitionDocument(document.status, to)) {
      throw new InvalidDocumentTransitionError(documentId, document.status, to);
    }
    const updated: Document = {
      ...document,
      status: to,
      statusBeforeArchive: to === 'archived' ? document.status : document.statusBeforeArchive,
      currentVersion: document.currentVersion + 1,
      updatedAt: now(),
    };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const document: Document = {
        id: generateId('document'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        title: input.title,
        documentType: input.documentType,
        folderId: input.folderId,
        ownerId: input.ownerId,
        status: 'draft',
        currentVersionNumber: 0,
        currentVersion: 1,
      };
      await repository.save(document);
      eventBus?.publish('document.created', { organizationId, documentId: document.id, title: document.title });
      return document;
    },

    async update(organizationId, documentId, input) {
      const document = await requireDocument(organizationId, documentId);
      if (document.status === 'archived') {
        throw new InvalidDocumentTransitionError(documentId, document.status, document.status);
      }
      const updated: Document = {
        ...document,
        title: input.title ?? document.title,
        folderId: input.folderId ?? document.folderId,
        ownerId: input.ownerId ?? document.ownerId,
        currentVersion: document.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('document.updated', { organizationId, documentId });
      return updated;
    },

    async submitForReview(organizationId, documentId) {
      const updated = await transition(organizationId, documentId, 'review');
      eventBus?.publish('document.reviewed', { organizationId, documentId });
      return updated;
    },

    async returnToDraft(organizationId, documentId) {
      return transition(organizationId, documentId, 'draft');
    },

    async approve(organizationId, documentId) {
      const updated = await transition(organizationId, documentId, 'approved');
      eventBus?.publish('document.approved', { organizationId, documentId });
      return updated;
    },

    async publish(organizationId, documentId) {
      const updated = await transition(organizationId, documentId, 'published');
      eventBus?.publish('document.published', { organizationId, documentId });
      return updated;
    },

    async archive(organizationId, documentId) {
      const updated = await transition(organizationId, documentId, 'archived');
      eventBus?.publish('document.archived', { organizationId, documentId });
      return updated;
    },

    async restore(organizationId, documentId) {
      const document = await requireDocument(organizationId, documentId);
      if (document.status !== 'archived') {
        throw new InvalidDocumentTransitionError(documentId, document.status, document.statusBeforeArchive ?? 'draft');
      }
      const to = document.statusBeforeArchive ?? 'draft';
      const updated: Document = { ...document, status: to, currentVersion: document.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('document.restored', { organizationId, documentId });
      return updated;
    },

    async delete(organizationId, documentId) {
      const document = await requireDocument(organizationId, documentId);
      if (document.status !== 'archived') {
        throw new InvalidDocumentTransitionError(documentId, document.status, 'deleted');
      }
      await repository.delete(organizationId, documentId);
      eventBus?.publish('document.deleted', { organizationId, documentId });
    },

    async get(organizationId, documentId) {
      return repository.findById(organizationId, documentId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByFolder(organizationId, folderId) {
      return repository.findByFolder(organizationId, folderId);
    },

    async findByType(organizationId, documentType) {
      return repository.findByType(organizationId, documentType);
    },

    async findByStatus(organizationId, status) {
      return repository.findByStatus(organizationId, status);
    },

    async findByOwner(organizationId, ownerId) {
      return repository.findByOwner(organizationId, ownerId);
    },

    async setCurrentVersionNumber(organizationId, documentId, versionNumber) {
      const document = await requireDocument(organizationId, documentId);
      const updated: Document = { ...document, currentVersionNumber: versionNumber, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },
  };
}
