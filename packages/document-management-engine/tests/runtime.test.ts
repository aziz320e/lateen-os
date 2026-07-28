import { describe, expect, it } from 'vitest';
import { createDocumentManagementRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createDocumentManagementRuntime', () => {
  it('wires every module together and works fully offline', async () => {
    const runtime = createDocumentManagementRuntime();
    const document = await runtime.documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    expect(document.status).toBe('draft');
    expect(await runtime.relationshipManagement.getCustomerContext(ORG, 'customer-1')).toBeNull();
  });

  it('shares one event bus across every engine by default', async () => {
    const runtime = createDocumentManagementRuntime();
    let seen: unknown;
    runtime.events.subscribe('document.created', (payload) => (seen = payload));
    const document = await runtime.documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    expect(seen).toEqual({ organizationId: ORG, documentId: document.id, title: 'MSA' });
  });

  it('accepts an injected event bus and clock', async () => {
    const { createDocumentManagementEventBus } = await import('../src/events/index.js');
    const eventBus = createDocumentManagementEventBus();
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const runtime = createDocumentManagementRuntime({ eventBus, now: fixedNow });
    const document = await runtime.documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    expect(document.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(runtime.events).toBe(eventBus);
  });

  it('queries reflect state mutated through the engines', async () => {
    const runtime = createDocumentManagementRuntime();
    await runtime.documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    const result = await runtime.queries.findDocuments({ organizationId: ORG });
    expect(result.total).toBe(1);
  });

  it('versions.createVersion() composes with the documents engine to advance currentVersionNumber', async () => {
    const runtime = createDocumentManagementRuntime();
    const document = await runtime.documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    await runtime.versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    const reloaded = await runtime.documents.get(ORG, document.id);
    expect(reloaded?.currentVersionNumber).toBe(1);
  });

  it('folders, metadata, and relationships are queryable through the runtime', async () => {
    const runtime = createDocumentManagementRuntime();
    const folder = await runtime.folders.create(ORG, { name: 'Contracts' });
    const document = await runtime.documents.create(ORG, { title: 'MSA', documentType: 'contract', folderId: folder.id });
    await runtime.metadata.upsertMetadata(ORG, { documentId: document.id, tags: ['urgent'] });
    await runtime.relationships.linkEntity(ORG, { documentId: document.id, relatedEntityType: 'project', relatedEntityId: 'project-1' });

    expect((await runtime.queries.findDocuments({ organizationId: ORG, folderId: folder.id })).total).toBe(1);
    expect((await runtime.queries.findMetadata({ organizationId: ORG, documentId: document.id })).total).toBe(1);
    expect((await runtime.queries.findRelationships({ organizationId: ORG, documentId: document.id })).total).toBe(1);
  });

  it('searchDocuments() finds records created through the runtime engines', async () => {
    const runtime = createDocumentManagementRuntime();
    await runtime.documents.create(ORG, { title: 'UniqueDocumentName', documentType: 'contract' });
    const result = await runtime.queries.searchDocuments({ organizationId: ORG, keyword: 'UniqueDocumentName' });
    expect(result.total).toBe(1);
  });

  it('a full document lifecycle (draft -> review -> approved -> published -> archived -> restored) works end to end through the runtime', async () => {
    const runtime = createDocumentManagementRuntime();
    const document = await runtime.documents.create(ORG, { title: 'Policy', documentType: 'policy' });
    await runtime.documents.submitForReview(ORG, document.id);
    await runtime.documents.approve(ORG, document.id);
    await runtime.documents.publish(ORG, document.id);
    await runtime.documents.archive(ORG, document.id);
    const restored = await runtime.documents.restore(ORG, document.id);
    expect(restored.status).toBe('published');
  });

  it('multiple versions and a restore compose correctly through the runtime', async () => {
    const runtime = createDocumentManagementRuntime();
    const document = await runtime.documents.create(ORG, { title: 'Spec', documentType: 'specification' });
    await runtime.versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    await runtime.versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-2' });
    const restored = await runtime.versions.restoreVersion(ORG, document.id, 1);
    expect(restored.currentVersionNumber).toBe(1);
  });

  it('metadata expiry detection composes correctly through the runtime', async () => {
    const runtime = createDocumentManagementRuntime();
    const document = await runtime.documents.create(ORG, { title: 'Policy', documentType: 'policy' });
    await runtime.metadata.upsertMetadata(ORG, { documentId: document.id, expiryDate: '2026-01-01' });
    let sawExpired = false;
    runtime.events.subscribe('document.expired', () => (sawExpired = true));
    await runtime.metadata.checkExpiry(ORG, document.id, '2026-06-01');
    expect(sawExpired).toBe(true);
  });

  it('folder hierarchy and document-to-folder association compose correctly through the runtime', async () => {
    const runtime = createDocumentManagementRuntime();
    const parent = await runtime.folders.create(ORG, { name: 'Legal' });
    const child = await runtime.folders.create(ORG, { name: 'Contracts', parentFolderId: parent.id });
    await runtime.documents.create(ORG, { title: 'MSA', documentType: 'contract', folderId: child.id });
    expect(await runtime.folders.getChildren(ORG, parent.id)).toEqual([child]);
    expect((await runtime.queries.findDocuments({ organizationId: ORG, folderId: child.id })).total).toBe(1);
  });

  it('runtime is fully usable with zero collaborators injected', async () => {
    const runtime = createDocumentManagementRuntime();
    expect(await runtime.relationshipManagement.getProjectContext(ORG, 'x')).toBeNull();
    expect(await runtime.relationshipManagement.getCustomerSuccessContext(ORG, 'x')).toBeNull();
    expect(await runtime.relationshipManagement.notifyDocumentEvent(ORG, { title: 't' })).toBeNull();
  });

  it('multiple documents across multiple folders are all independently queryable', async () => {
    const runtime = createDocumentManagementRuntime();
    const folderA = await runtime.folders.create(ORG, { name: 'A' });
    const folderB = await runtime.folders.create(ORG, { name: 'B' });
    await runtime.documents.create(ORG, { title: 'Doc A', documentType: 'contract', folderId: folderA.id });
    await runtime.documents.create(ORG, { title: 'Doc B', documentType: 'policy', folderId: folderB.id });
    expect((await runtime.queries.findDocuments({ organizationId: ORG, folderId: folderA.id })).total).toBe(1);
    expect((await runtime.queries.findDocuments({ organizationId: ORG, folderId: folderB.id })).total).toBe(1);
  });

  it('relationships composed through the runtime are queryable by related entity', async () => {
    const runtime = createDocumentManagementRuntime();
    const document = await runtime.documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    await runtime.relationships.linkEntity(ORG, { documentId: document.id, relatedEntityType: 'customer', relatedEntityId: 'customer-1' });
    const result = await runtime.queries.findRelationships({ organizationId: ORG, relatedEntityType: 'customer', relatedEntityId: 'customer-1' });
    expect(result.total).toBe(1);
  });

  it('deleting a document through the runtime removes it from every subsequent query', async () => {
    const runtime = createDocumentManagementRuntime();
    const document = await runtime.documents.create(ORG, { title: 'X', documentType: 'contract' });
    await runtime.documents.archive(ORG, document.id);
    await runtime.documents.delete(ORG, document.id);
    const result = await runtime.queries.findDocuments({ organizationId: ORG });
    expect(result.total).toBe(0);
  });

  it('folder archival through the runtime is reflected in findFolders()', async () => {
    const runtime = createDocumentManagementRuntime();
    const folder = await runtime.folders.create(ORG, { name: 'X' });
    await runtime.folders.archive(ORG, folder.id);
    const result = await runtime.queries.findFolders({ organizationId: ORG, status: 'archived' });
    expect(result.total).toBe(1);
  });
});
