/**
 * Real Metadata engine — tags, categories, owners, retention, and
 * expiry for a document, plus deterministic expiry detection.
 *
 * @module metadata/engine.impl
 */
import type { DocumentId } from '../document/types.js';
import type { DocumentManagementEventBus } from '../events/document-management-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { DocumentMetadataRepository } from './repository.js';
import type { DocumentMetadata } from './types.js';

/** Whether an expiry date has passed as of a given date (both inclusive of the expiry day itself counting as expired). */
export function isExpired(expiryDate: ISODate | undefined, asOfDate: ISODate): boolean {
  if (!expiryDate) return false;
  return asOfDate >= expiryDate;
}

export interface UpsertDocumentMetadataInput {
  readonly documentId: DocumentId;
  readonly tags?: readonly string[];
  readonly categories?: readonly string[];
  readonly owners?: readonly string[];
  readonly retentionDays?: number;
  readonly expiryDate?: ISODate;
}

export interface MetadataEngine {
  upsertMetadata(organizationId: OrganizationId, input: UpsertDocumentMetadataInput): Promise<DocumentMetadata>;
  addTag(organizationId: OrganizationId, documentId: DocumentId, tag: string): Promise<DocumentMetadata>;
  removeTag(organizationId: OrganizationId, documentId: DocumentId, tag: string): Promise<DocumentMetadata>;
  addCategory(organizationId: OrganizationId, documentId: DocumentId, category: string): Promise<DocumentMetadata>;
  removeCategory(organizationId: OrganizationId, documentId: DocumentId, category: string): Promise<DocumentMetadata>;
  /** Checks whether the document's metadata is expired as of `asOfDate`; publishes `document.expired` the first time it transitions to expired. */
  checkExpiry(organizationId: OrganizationId, documentId: DocumentId, asOfDate: ISODate): Promise<boolean>;
  get(organizationId: OrganizationId, metadataId: string): Promise<DocumentMetadata | null>;
  list(organizationId: OrganizationId): Promise<readonly DocumentMetadata[]>;
  findByDocument(organizationId: OrganizationId, documentId: DocumentId): Promise<DocumentMetadata | null>;
  findByCategory(organizationId: OrganizationId, category: string): Promise<readonly DocumentMetadata[]>;
  findByTag(organizationId: OrganizationId, tag: string): Promise<readonly DocumentMetadata[]>;
}

/** Creates a real {@link MetadataEngine}. */
export function createMetadataEngine(
  repository: DocumentMetadataRepository,
  eventBus?: DocumentManagementEventBus,
  now: () => string = nowIso,
): MetadataEngine {
  async function getOrCreate(organizationId: OrganizationId, documentId: DocumentId): Promise<DocumentMetadata> {
    const existing = await repository.findByDocument(organizationId, documentId);
    if (existing) return existing;
    const timestamp = now();
    const created: DocumentMetadata = {
      id: generateId('document-metadata'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      documentId,
      tags: [],
      categories: [],
      owners: [],
      expired: false,
    };
    await repository.save(created);
    return created;
  }

  return {
    async upsertMetadata(organizationId, input) {
      const existing = await getOrCreate(organizationId, input.documentId);
      const updated: DocumentMetadata = {
        ...existing,
        tags: input.tags ?? existing.tags,
        categories: input.categories ?? existing.categories,
        owners: input.owners ?? existing.owners,
        retentionDays: input.retentionDays ?? existing.retentionDays,
        expiryDate: input.expiryDate ?? existing.expiryDate,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async addTag(organizationId, documentId, tag) {
      const metadata = await getOrCreate(organizationId, documentId);
      if (metadata.tags.includes(tag)) return metadata;
      const updated: DocumentMetadata = { ...metadata, tags: [...metadata.tags, tag], updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async removeTag(organizationId, documentId, tag) {
      const metadata = await getOrCreate(organizationId, documentId);
      const updated: DocumentMetadata = { ...metadata, tags: metadata.tags.filter((existingTag) => existingTag !== tag), updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async addCategory(organizationId, documentId, category) {
      const metadata = await getOrCreate(organizationId, documentId);
      if (metadata.categories.includes(category)) return metadata;
      const updated: DocumentMetadata = { ...metadata, categories: [...metadata.categories, category], updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async removeCategory(organizationId, documentId, category) {
      const metadata = await getOrCreate(organizationId, documentId);
      const updated: DocumentMetadata = { ...metadata, categories: metadata.categories.filter((existingCategory) => existingCategory !== category), updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async checkExpiry(organizationId, documentId, asOfDate) {
      const metadata = await getOrCreate(organizationId, documentId);
      const expiredNow = isExpired(metadata.expiryDate, asOfDate);
      if (expiredNow && !metadata.expired) {
        await repository.save({ ...metadata, expired: true, updatedAt: now() });
        eventBus?.publish('document.expired', { organizationId, documentId });
      }
      return expiredNow;
    },

    async get(organizationId, metadataId) {
      return repository.findById(organizationId, metadataId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByDocument(organizationId, documentId) {
      return repository.findByDocument(organizationId, documentId);
    },

    async findByCategory(organizationId, category) {
      return repository.findByCategory(organizationId, category);
    },

    async findByTag(organizationId, tag) {
      return repository.findByTag(organizationId, tag);
    },
  };
}
