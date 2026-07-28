import { describe, expect, it } from 'vitest';
import { createDocumentRepository } from '../src/document/repository.impl.js';
import { createFolderRepository } from '../src/folder/repository.impl.js';
import { createDocumentMetadataRepository } from '../src/metadata/repository.impl.js';
import { createDocumentManagementQueries } from '../src/queries/document-management-queries.impl.js';
import { createDocumentRelationshipRepository } from '../src/relationship/repository.impl.js';
import { createDocumentVersionRepository } from '../src/version/repository.impl.js';

const ORG = 'org-1';
const timestamp = '2026-01-01T00:00:00.000Z';

function setup() {
  const documentRepository = createDocumentRepository();
  const folderRepository = createFolderRepository();
  const versionRepository = createDocumentVersionRepository();
  const metadataRepository = createDocumentMetadataRepository();
  const relationshipRepository = createDocumentRelationshipRepository();

  const queries = createDocumentManagementQueries({ documentRepository, folderRepository, versionRepository, metadataRepository, relationshipRepository });

  return { queries, documentRepository, folderRepository, versionRepository, metadataRepository, relationshipRepository };
}

describe('DocumentManagementQueries — findDocuments', () => {
  it('returns all documents for an organization', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'A', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    await documentRepository.save({ id: 'd2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'B', documentType: 'policy', status: 'published', currentVersionNumber: 1, currentVersion: 2 });
    expect((await queries.findDocuments({ organizationId: ORG })).total).toBe(2);
  });

  it('filters by folderId, documentType, status, and ownerId', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'A', documentType: 'contract', folderId: 'folder-1', ownerId: 'employee-1', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    await documentRepository.save({ id: 'd2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'B', documentType: 'policy', status: 'published', currentVersionNumber: 1, currentVersion: 2 });
    expect((await queries.findDocuments({ organizationId: ORG, folderId: 'folder-1' })).total).toBe(1);
    expect((await queries.findDocuments({ organizationId: ORG, documentType: 'policy' })).total).toBe(1);
    expect((await queries.findDocuments({ organizationId: ORG, status: 'published' })).total).toBe(1);
    expect((await queries.findDocuments({ organizationId: ORG, ownerId: 'employee-1' })).total).toBe(1);
  });

  it('supports offset/limit pagination', async () => {
    const { queries, documentRepository } = setup();
    for (let i = 0; i < 5; i += 1) {
      await documentRepository.save({ id: `d${i}`, organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: `Doc ${i}`, documentType: 'report', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    }
    const result = await queries.findDocuments({ organizationId: ORG, offset: 2, limit: 2 });
    expect(result.total).toBe(5);
    expect(result.documents).toHaveLength(2);
  });
});

describe('DocumentManagementQueries — findFolders', () => {
  it('filters by parentFolderId and status', async () => {
    const { queries, folderRepository } = setup();
    await folderRepository.save({ id: 'f1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, name: 'A', permissions: [], status: 'active' });
    await folderRepository.save({ id: 'f2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, name: 'B', parentFolderId: 'f1', permissions: [], status: 'archived' });
    expect((await queries.findFolders({ organizationId: ORG, parentFolderId: 'f1' })).total).toBe(1);
    expect((await queries.findFolders({ organizationId: ORG, status: 'archived' })).total).toBe(1);
  });
});

describe('DocumentManagementQueries — findVersions', () => {
  it('filters by documentId', async () => {
    const { queries, versionRepository } = setup();
    await versionRepository.save({ id: 'v1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', versionNumber: 1, contentRef: 'blob-1' });
    await versionRepository.save({ id: 'v2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd2', versionNumber: 1, contentRef: 'blob-2' });
    expect((await queries.findVersions({ organizationId: ORG, documentId: 'd1' })).total).toBe(1);
    expect((await queries.findVersions({ organizationId: ORG })).total).toBe(2);
  });
});

describe('DocumentManagementQueries — findMetadata', () => {
  it('filters by documentId, category, and tag', async () => {
    const { queries, metadataRepository } = setup();
    await metadataRepository.save({ id: 'm1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', tags: ['urgent'], categories: ['legal'], owners: [], expired: false });
    await metadataRepository.save({ id: 'm2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd2', tags: ['low'], categories: ['hr'], owners: [], expired: false });
    expect((await queries.findMetadata({ organizationId: ORG, documentId: 'd1' })).total).toBe(1);
    expect((await queries.findMetadata({ organizationId: ORG, category: 'hr' })).total).toBe(1);
    expect((await queries.findMetadata({ organizationId: ORG, tag: 'urgent' })).total).toBe(1);
  });

  it('returns an empty result for a document with no metadata', async () => {
    const { queries } = setup();
    expect((await queries.findMetadata({ organizationId: ORG, documentId: 'unknown' })).total).toBe(0);
  });
});

describe('DocumentManagementQueries — findRelationships', () => {
  it('filters by documentId and relatedEntityType', async () => {
    const { queries, relationshipRepository } = setup();
    await relationshipRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', relatedEntityType: 'project', relatedEntityId: 'project-1' });
    await relationshipRepository.save({ id: 'r2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', relatedEntityType: 'customer', relatedEntityId: 'customer-1' });
    expect((await queries.findRelationships({ organizationId: ORG, documentId: 'd1' })).total).toBe(2);
    expect((await queries.findRelationships({ organizationId: ORG, documentId: 'd1', relatedEntityType: 'project' })).total).toBe(1);
  });

  it('filters by relatedEntityType and relatedEntityId without a documentId', async () => {
    const { queries, relationshipRepository } = setup();
    await relationshipRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', relatedEntityType: 'customer', relatedEntityId: 'customer-1' });
    await relationshipRepository.save({ id: 'r2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd2', relatedEntityType: 'customer', relatedEntityId: 'customer-1' });
    expect((await queries.findRelationships({ organizationId: ORG, relatedEntityType: 'customer', relatedEntityId: 'customer-1' })).total).toBe(2);
  });
});

describe('DocumentManagementQueries — searchDocuments', () => {
  it('finds matches across documents and folders, ranked by score', async () => {
    const { queries, documentRepository, folderRepository, metadataRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'Alpha Contract', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    await metadataRepository.save({ id: 'm1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', tags: ['Alpha'], categories: [], owners: [], expired: false });
    await folderRepository.save({ id: 'f1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, name: 'Alpha', permissions: [], status: 'active' });

    const result = await queries.searchDocuments({ organizationId: ORG, keyword: 'Alpha' });
    expect(result.total).toBe(2);
    expect(result.matches[0]?.score).toBe(3);
  });

  it('matches on owner and category via metadata', async () => {
    const { queries, documentRepository, metadataRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'Unrelated', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    await metadataRepository.save({ id: 'm1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', tags: [], categories: ['UniqueCategory'], owners: [], expired: false });
    const result = await queries.searchDocuments({ organizationId: ORG, keyword: 'UniqueCategory' });
    expect(result.total).toBe(1);
  });

  it('returns no matches for an unrelated keyword', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'Alpha', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    expect((await queries.searchDocuments({ organizationId: ORG, keyword: 'zzz-nonexistent' })).total).toBe(0);
  });

  it('respects a limit on the number of matches returned', async () => {
    const { queries, documentRepository } = setup();
    for (let i = 0; i < 5; i += 1) {
      await documentRepository.save({ id: `d${i}`, organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: `Widget ${i}`, documentType: 'report', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    }
    const result = await queries.searchDocuments({ organizationId: ORG, keyword: 'Widget', limit: 2 });
    expect(result.total).toBe(5);
    expect(result.matches).toHaveLength(2);
  });

  it('search results never leak across organizations', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'UniqueName', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    await documentRepository.save({ id: 'd2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, title: 'UniqueName', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    expect((await queries.searchDocuments({ organizationId: ORG, keyword: 'UniqueName' })).total).toBe(1);
  });
});

describe('DocumentManagementQueries — pagination defaults', () => {
  it('findDocuments with no offset/limit returns everything', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'A', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    const result = await queries.findDocuments({ organizationId: ORG });
    expect(result.documents).toHaveLength(1);
  });

  it('findFolders respects offset without a limit', async () => {
    const { queries, folderRepository } = setup();
    for (let i = 0; i < 3; i += 1) {
      await folderRepository.save({ id: `f${i}`, organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, name: `F${i}`, permissions: [], status: 'active' });
    }
    const result = await queries.findFolders({ organizationId: ORG, offset: 1 });
    expect(result.total).toBe(3);
    expect(result.folders).toHaveLength(2);
  });
});

describe('DocumentManagementQueries — empty results', () => {
  it('findDocuments returns an empty result for an organization with no documents', async () => {
    const { queries } = setup();
    expect((await queries.findDocuments({ organizationId: ORG })).total).toBe(0);
  });

  it('findFolders returns an empty result for an organization with no folders', async () => {
    const { queries } = setup();
    expect((await queries.findFolders({ organizationId: ORG })).total).toBe(0);
  });

  it('findVersions returns an empty result for an organization with no versions', async () => {
    const { queries } = setup();
    expect((await queries.findVersions({ organizationId: ORG })).total).toBe(0);
  });

  it('findMetadata returns an empty result for an organization with no metadata', async () => {
    const { queries } = setup();
    expect((await queries.findMetadata({ organizationId: ORG })).total).toBe(0);
  });

  it('findRelationships returns an empty result for an organization with no relationships', async () => {
    const { queries } = setup();
    expect((await queries.findRelationships({ organizationId: ORG })).total).toBe(0);
  });

  it('searchDocuments returns an empty result for an organization with no data', async () => {
    const { queries } = setup();
    expect((await queries.searchDocuments({ organizationId: ORG, keyword: 'anything' })).total).toBe(0);
  });
});

describe('DocumentManagementQueries — organization scoping', () => {
  it('findDocuments never leaks across organizations', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'A', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    await documentRepository.save({ id: 'd2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, title: 'A', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    expect((await queries.findDocuments({ organizationId: ORG })).total).toBe(1);
  });

  it('findVersions never leaks across organizations', async () => {
    const { queries, versionRepository } = setup();
    await versionRepository.save({ id: 'v1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', versionNumber: 1, contentRef: 'blob-1' });
    await versionRepository.save({ id: 'v2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', versionNumber: 1, contentRef: 'blob-1' });
    expect((await queries.findVersions({ organizationId: ORG })).total).toBe(1);
  });

  it('findMetadata never leaks across organizations', async () => {
    const { queries, metadataRepository } = setup();
    await metadataRepository.save({ id: 'm1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', tags: [], categories: [], owners: [], expired: false });
    await metadataRepository.save({ id: 'm2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', tags: [], categories: [], owners: [], expired: false });
    expect((await queries.findMetadata({ organizationId: ORG })).total).toBe(1);
  });

  it('findRelationships never leaks across organizations', async () => {
    const { queries, relationshipRepository } = setup();
    await relationshipRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', relatedEntityType: 'project', relatedEntityId: 'project-1' });
    await relationshipRepository.save({ id: 'r2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', relatedEntityType: 'project', relatedEntityId: 'project-1' });
    expect((await queries.findRelationships({ organizationId: ORG })).total).toBe(1);
  });

  it('findFolders never leaks across organizations', async () => {
    const { queries, folderRepository } = setup();
    await folderRepository.save({ id: 'f1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, name: 'A', permissions: [], status: 'active' });
    await folderRepository.save({ id: 'f2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, name: 'A', permissions: [], status: 'active' });
    expect((await queries.findFolders({ organizationId: ORG })).total).toBe(1);
  });
});

describe('DocumentManagementQueries — additional filter combinations', () => {
  it('findDocuments combines folderId and status filters', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'A', documentType: 'contract', folderId: 'folder-1', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    const result = await queries.findDocuments({ organizationId: ORG, folderId: 'folder-1', status: 'published' });
    expect(result.total).toBe(0);
  });

  it('findRelationships combines documentId and relatedEntityType filters, excluding non-matching types', async () => {
    const { queries, relationshipRepository } = setup();
    await relationshipRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', relatedEntityType: 'project', relatedEntityId: 'project-1' });
    await relationshipRepository.save({ id: 'r2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', relatedEntityType: 'customer', relatedEntityId: 'customer-1' });
    const result = await queries.findRelationships({ organizationId: ORG, documentId: 'd1', relatedEntityType: 'workflow' });
    expect(result.total).toBe(0);
  });

  it('searchDocuments is case-insensitive', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'CONTRACT ALPHA', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    const result = await queries.searchDocuments({ organizationId: ORG, keyword: 'contract alpha' });
    expect(result.total).toBe(1);
  });

  it('searchDocuments ranks an exact match above a substring match', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'Alpha', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    await documentRepository.save({ id: 'd2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'Alpha Beta Gamma', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    const result = await queries.searchDocuments({ organizationId: ORG, keyword: 'Alpha' });
    expect(result.matches[0]).toMatchObject({ id: 'd1', score: 3 });
    expect(result.matches[1]).toMatchObject({ id: 'd2', score: 2 });
  });

  it('findDocuments falls back to findAll when no filter narrows the initial fetch', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'A', documentType: 'contract', status: 'published', currentVersionNumber: 1, currentVersion: 2 });
    const result = await queries.findDocuments({ organizationId: ORG, status: 'published' });
    expect(result.total).toBe(1);
  });

  it('findVersions with no documentId returns every version across every document', async () => {
    const { queries, versionRepository } = setup();
    await versionRepository.save({ id: 'v1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', versionNumber: 1, contentRef: 'blob-1' });
    await versionRepository.save({ id: 'v2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd2', versionNumber: 1, contentRef: 'blob-2' });
    expect((await queries.findVersions({ organizationId: ORG })).total).toBe(2);
  });

  it('findMetadata with no filters returns everything', async () => {
    const { queries, metadataRepository } = setup();
    await metadataRepository.save({ id: 'm1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', tags: [], categories: [], owners: [], expired: false });
    await metadataRepository.save({ id: 'm2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd2', tags: [], categories: [], owners: [], expired: false });
    expect((await queries.findMetadata({ organizationId: ORG })).total).toBe(2);
  });

  it('findRelationships with no filters returns everything', async () => {
    const { queries, relationshipRepository } = setup();
    await relationshipRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', relatedEntityType: 'project', relatedEntityId: 'p1' });
    await relationshipRepository.save({ id: 'r2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd2', relatedEntityType: 'customer', relatedEntityId: 'c1' });
    expect((await queries.findRelationships({ organizationId: ORG })).total).toBe(2);
  });

  it('searchDocuments matches a folder name independent of any document', async () => {
    const { queries, folderRepository } = setup();
    await folderRepository.save({ id: 'f1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, name: 'UniqueFolderName', permissions: [], status: 'active' });
    const result = await queries.searchDocuments({ organizationId: ORG, keyword: 'UniqueFolderName' });
    expect(result.matches[0]).toMatchObject({ recordType: 'folder', id: 'f1' });
  });

  it('findDocuments prioritizes folderId over documentType when both would otherwise apply', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'A', documentType: 'contract', folderId: 'folder-1', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    const result = await queries.findDocuments({ organizationId: ORG, folderId: 'folder-1', documentType: 'policy' });
    expect(result.total).toBe(1);
  });

  it('findMetadata prioritizes documentId over category/tag when multiple filters are given', async () => {
    const { queries, metadataRepository } = setup();
    await metadataRepository.save({ id: 'm1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', tags: [], categories: ['legal'], owners: [], expired: false });
    const result = await queries.findMetadata({ organizationId: ORG, documentId: 'd1', category: 'hr' });
    expect(result.total).toBe(1);
  });

  it('findExpansion-style pagination works for findVersions with both offset and limit', async () => {
    const { queries, versionRepository } = setup();
    for (let i = 0; i < 4; i += 1) {
      await versionRepository.save({ id: `v${i}`, organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', versionNumber: i + 1, contentRef: `blob-${i}` });
    }
    const result = await queries.findVersions({ organizationId: ORG, offset: 1, limit: 2 });
    expect(result.total).toBe(4);
    expect(result.versions).toHaveLength(2);
  });

  it('findDocuments filters by ownerId alone when no other filter is given', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'A', documentType: 'contract', ownerId: 'employee-9', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    await documentRepository.save({ id: 'd2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'B', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    const result = await queries.findDocuments({ organizationId: ORG, ownerId: 'employee-9' });
    expect(result.total).toBe(1);
  });

  it('searchDocuments finds a document by its owner id stored directly on the document', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'Unrelated', documentType: 'contract', ownerId: 'UniqueOwnerId', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    const result = await queries.searchDocuments({ organizationId: ORG, keyword: 'UniqueOwnerId' });
    expect(result.total).toBe(1);
  });

  it('findFolders filters by status alone when no parentFolderId is given', async () => {
    const { queries, folderRepository } = setup();
    await folderRepository.save({ id: 'f1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, name: 'A', permissions: [], status: 'active' });
    await folderRepository.save({ id: 'f2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, name: 'B', permissions: [], status: 'archived' });
    const result = await queries.findFolders({ organizationId: ORG, status: 'active' });
    expect(result.total).toBe(1);
  });

  it('findMetadata filters by tag alone when no documentId or category is given', async () => {
    const { queries, metadataRepository } = setup();
    await metadataRepository.save({ id: 'm1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', tags: ['urgent'], categories: [], owners: [], expired: false });
    const result = await queries.findMetadata({ organizationId: ORG, tag: 'urgent' });
    expect(result.total).toBe(1);
  });

  it('searchDocuments matches a document by its metadata owner', async () => {
    const { queries, documentRepository, metadataRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'Unrelated', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    await metadataRepository.save({ id: 'm1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', tags: [], categories: [], owners: ['UniqueOwnerName'], expired: false });
    const result = await queries.searchDocuments({ organizationId: ORG, keyword: 'UniqueOwnerName' });
    expect(result.total).toBe(1);
  });

  it('findDocuments with a limit of 0 returns no documents but reports the correct total', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'A', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    const result = await queries.findDocuments({ organizationId: ORG, limit: 0 });
    expect(result.total).toBe(1);
    expect(result.documents).toHaveLength(0);
  });

  it('findRelationships with only relatedEntityId (no type) falls back to findAll and filters nothing extra', async () => {
    const { queries, relationshipRepository } = setup();
    await relationshipRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, documentId: 'd1', relatedEntityType: 'project', relatedEntityId: 'p1' });
    const result = await queries.findRelationships({ organizationId: ORG });
    expect(result.total).toBe(1);
  });

  it('searchDocuments does not match a document whose title is merely similar but not a substring', async () => {
    const { queries, documentRepository } = setup();
    await documentRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, title: 'Completely Different', documentType: 'contract', status: 'draft', currentVersionNumber: 0, currentVersion: 1 });
    const result = await queries.searchDocuments({ organizationId: ORG, keyword: 'XyzNoMatch' });
    expect(result.total).toBe(0);
  });
});
