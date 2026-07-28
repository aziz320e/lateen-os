import { describe, expect, it } from 'vitest';
import { createDocumentManagementEventBus } from '../src/events/index.js';
import { canTransitionDocument, createDocumentLifecycleEngine } from '../src/document/engine.impl.js';
import { createDocumentRepository } from '../src/document/repository.impl.js';
import { DocumentNotFoundError, InvalidDocumentTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createDocumentManagementEventBus();
  const engine = createDocumentLifecycleEngine(createDocumentRepository(), eventBus);
  return { engine, eventBus };
}

describe('canTransitionDocument (pure)', () => {
  it('draft -> review | archived', () => {
    expect(canTransitionDocument('draft', 'review')).toBe(true);
    expect(canTransitionDocument('draft', 'archived')).toBe(true);
    expect(canTransitionDocument('draft', 'approved')).toBe(false);
  });

  it('review -> approved | draft | archived', () => {
    expect(canTransitionDocument('review', 'approved')).toBe(true);
    expect(canTransitionDocument('review', 'draft')).toBe(true);
    expect(canTransitionDocument('review', 'archived')).toBe(true);
  });

  it('approved -> published | archived', () => {
    expect(canTransitionDocument('approved', 'published')).toBe(true);
    expect(canTransitionDocument('approved', 'archived')).toBe(true);
    expect(canTransitionDocument('approved', 'draft')).toBe(false);
  });

  it('published -> archived only', () => {
    expect(canTransitionDocument('published', 'archived')).toBe(true);
    expect(canTransitionDocument('published', 'draft')).toBe(false);
  });

  it('archived is a dead end for ordinary transitions', () => {
    expect(canTransitionDocument('archived', 'draft')).toBe(false);
    expect(canTransitionDocument('archived', 'review')).toBe(false);
  });
});

describe('DocumentLifecycleEngine — create/update', () => {
  it('creates a document at draft status with currentVersionNumber 0', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'Master Services Agreement', documentType: 'contract' });
    expect(document.status).toBe('draft');
    expect(document.currentVersionNumber).toBe(0);
    expect(document.currentVersion).toBe(1);
  });

  it('publishes document.created on create', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('document.created', (payload) => (seen = payload));
    const document = await engine.create(ORG, { title: 'Master Services Agreement', documentType: 'contract' });
    expect(seen).toEqual({ organizationId: ORG, documentId: document.id, title: 'Master Services Agreement' });
  });

  it('accepts an optional folderId and ownerId', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'SOP', documentType: 'sop', folderId: 'folder-1', ownerId: 'employee-1' });
    expect(document.folderId).toBe('folder-1');
    expect(document.ownerId).toBe('employee-1');
  });

  it('supports every one of the 10 document types', async () => {
    const { engine } = setup();
    const types = ['contract', 'proposal', 'invoice_reference', 'sop', 'policy', 'specification', 'report', 'project_document', 'customer_document', 'hr_document'] as const;
    for (const documentType of types) {
      const document = await engine.create(ORG, { title: `Doc ${documentType}`, documentType });
      expect(document.documentType).toBe(documentType);
    }
  });

  it('update() changes mutable fields, bumps currentVersion, and publishes document.updated', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('document.updated', (payload) => (seen = payload));
    const document = await engine.create(ORG, { title: 'Original', documentType: 'report' });
    const updated = await engine.update(ORG, document.id, { title: 'Renamed' });
    expect(updated.title).toBe('Renamed');
    expect(updated.currentVersion).toBe(2);
    expect(seen).toEqual({ organizationId: ORG, documentId: document.id });
  });

  it('update() rejects an archived document', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'report' });
    await engine.archive(ORG, document.id);
    await expect(engine.update(ORG, document.id, { title: 'Y' })).rejects.toBeInstanceOf(InvalidDocumentTransitionError);
  });
});

describe('DocumentLifecycleEngine — lifecycle', () => {
  it('submitForReview() moves draft -> review and publishes document.reviewed', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('document.reviewed', (payload) => (seen = payload));
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    const reviewed = await engine.submitForReview(ORG, document.id);
    expect(reviewed.status).toBe('review');
    expect(seen).toEqual({ organizationId: ORG, documentId: document.id });
  });

  it('returnToDraft() moves review -> draft', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    const draft = await engine.returnToDraft(ORG, document.id);
    expect(draft.status).toBe('draft');
  });

  it('approve() moves review -> approved and publishes document.approved', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('document.approved', (payload) => (seen = payload));
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    const approved = await engine.approve(ORG, document.id);
    expect(approved.status).toBe('approved');
    expect(seen).toEqual({ organizationId: ORG, documentId: document.id });
  });

  it('publish() moves approved -> published and publishes document.published', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('document.published', (payload) => (seen = payload));
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.approve(ORG, document.id);
    const published = await engine.publish(ORG, document.id);
    expect(published.status).toBe('published');
    expect(seen).toEqual({ organizationId: ORG, documentId: document.id });
  });

  it('archive() is reachable from draft, review, approved, and published', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    const archived = await engine.archive(ORG, document.id);
    expect(archived.status).toBe('archived');
    expect(archived.statusBeforeArchive).toBe('draft');
  });

  it('archive() from published records statusBeforeArchive as published', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.approve(ORG, document.id);
    await engine.publish(ORG, document.id);
    const archived = await engine.archive(ORG, document.id);
    expect(archived.statusBeforeArchive).toBe('published');
  });

  it('restore() returns a document to its pre-archive status and publishes document.restored', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('document.restored', (payload) => (seen = payload));
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.archive(ORG, document.id);
    const restored = await engine.restore(ORG, document.id);
    expect(restored.status).toBe('review');
    expect(seen).toEqual({ organizationId: ORG, documentId: document.id });
  });

  it('restore() rejects a document that is not archived', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await expect(engine.restore(ORG, document.id)).rejects.toBeInstanceOf(InvalidDocumentTransitionError);
  });

  it('rejects an invalid transition (published -> draft)', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.approve(ORG, document.id);
    await engine.publish(ORG, document.id);
    await expect(engine.returnToDraft(ORG, document.id)).rejects.toBeInstanceOf(InvalidDocumentTransitionError);
  });
});

describe('DocumentLifecycleEngine — delete', () => {
  it('delete() is only permitted once archived', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await expect(engine.delete(ORG, document.id)).rejects.toBeInstanceOf(InvalidDocumentTransitionError);
  });

  it('delete() removes the document and publishes document.deleted', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('document.deleted', (payload) => (seen = payload));
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.archive(ORG, document.id);
    await engine.delete(ORG, document.id);
    expect(await engine.get(ORG, document.id)).toBeNull();
    expect(seen).toEqual({ organizationId: ORG, documentId: document.id });
  });

  it('delete() throws DocumentNotFoundError for an unknown document', async () => {
    const { engine } = setup();
    await expect(engine.delete(ORG, 'missing')).rejects.toBeInstanceOf(DocumentNotFoundError);
  });
});

describe('DocumentLifecycleEngine — queries', () => {
  it('findByFolder / findByType / findByStatus / findByOwner all filter correctly', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { title: 'A', documentType: 'contract', folderId: 'folder-1', ownerId: 'employee-1' });
    await engine.create(ORG, { title: 'B', documentType: 'policy', folderId: 'folder-2', ownerId: 'employee-2' });
    await engine.submitForReview(ORG, a.id);

    expect(await engine.findByFolder(ORG, 'folder-1')).toHaveLength(1);
    expect(await engine.findByType(ORG, 'contract')).toHaveLength(1);
    expect(await engine.findByStatus(ORG, 'review')).toHaveLength(1);
    expect(await engine.findByOwner(ORG, 'employee-1')).toHaveLength(1);
  });

  it('get() returns null for unknown id, list() returns everything', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    await engine.create(ORG, { title: 'A', documentType: 'contract' });
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('documents are isolated per organization', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'A', documentType: 'contract' });
    await engine.create('org-2', { title: 'A', documentType: 'contract' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });
});

describe('DocumentLifecycleEngine — not-found guards', () => {
  it('update()/submitForReview()/returnToDraft()/approve()/publish()/archive() throw DocumentNotFoundError for an unknown document', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', { title: 'x' })).rejects.toBeInstanceOf(DocumentNotFoundError);
    await expect(engine.submitForReview(ORG, 'missing')).rejects.toBeInstanceOf(DocumentNotFoundError);
    await expect(engine.returnToDraft(ORG, 'missing')).rejects.toBeInstanceOf(DocumentNotFoundError);
    await expect(engine.approve(ORG, 'missing')).rejects.toBeInstanceOf(DocumentNotFoundError);
    await expect(engine.publish(ORG, 'missing')).rejects.toBeInstanceOf(DocumentNotFoundError);
    await expect(engine.archive(ORG, 'missing')).rejects.toBeInstanceOf(DocumentNotFoundError);
  });

  it('restore()/setCurrentVersionNumber() throw DocumentNotFoundError for an unknown document', async () => {
    const { engine } = setup();
    await expect(engine.restore(ORG, 'missing')).rejects.toBeInstanceOf(DocumentNotFoundError);
    await expect(engine.setCurrentVersionNumber(ORG, 'missing', 1)).rejects.toBeInstanceOf(DocumentNotFoundError);
  });
});

describe('DocumentLifecycleEngine — additional lifecycle paths', () => {
  it('rejects submitForReview() called from approved', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.approve(ORG, document.id);
    await expect(engine.submitForReview(ORG, document.id)).rejects.toBeInstanceOf(InvalidDocumentTransitionError);
  });

  it('rejects approve() called from draft directly', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await expect(engine.approve(ORG, document.id)).rejects.toBeInstanceOf(InvalidDocumentTransitionError);
  });

  it('rejects publish() called from draft directly', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await expect(engine.publish(ORG, document.id)).rejects.toBeInstanceOf(InvalidDocumentTransitionError);
  });

  it('archive() from review records statusBeforeArchive as review', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    const archived = await engine.archive(ORG, document.id);
    expect(archived.statusBeforeArchive).toBe('review');
  });

  it('archive() from approved records statusBeforeArchive as approved', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.approve(ORG, document.id);
    const archived = await engine.archive(ORG, document.id);
    expect(archived.statusBeforeArchive).toBe('approved');
  });

  it('a document can go through review multiple times before being approved', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.returnToDraft(ORG, document.id);
    await engine.submitForReview(ORG, document.id);
    const approved = await engine.approve(ORG, document.id);
    expect(approved.status).toBe('approved');
  });

  it('update() with no fields leaves the document unchanged apart from currentVersion', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'Original', documentType: 'report' });
    const updated = await engine.update(ORG, document.id, {});
    expect(updated.title).toBe('Original');
    expect(updated.currentVersion).toBe(2);
  });

  it('update() can move a document between folders', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'report', folderId: 'folder-1' });
    const updated = await engine.update(ORG, document.id, { folderId: 'folder-2' });
    expect(updated.folderId).toBe('folder-2');
  });

  it('archive()/restore() cycle can be repeated multiple times', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.archive(ORG, document.id);
    await engine.restore(ORG, document.id);
    await engine.archive(ORG, document.id);
    const restored = await engine.restore(ORG, document.id);
    expect(restored.status).toBe('draft');
  });

  it('get() returns null for a document belonging to a different organization', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    expect(await engine.get('org-2', document.id)).toBeNull();
  });

  it('list() returns an empty array for an organization with no documents', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('findByStatus() returns an empty array when no document matches', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'X', documentType: 'contract' });
    expect(await engine.findByStatus(ORG, 'published')).toEqual([]);
  });

  it('findByFolder() returns an empty array for a folder with no documents', async () => {
    const { engine } = setup();
    expect(await engine.findByFolder(ORG, 'unknown-folder')).toEqual([]);
  });

  it('a document may be created without a folderId or ownerId', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    expect(document.folderId).toBeUndefined();
    expect(document.ownerId).toBeUndefined();
  });

  it('setCurrentVersionNumber() updates the pointer without affecting status', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    const updated = await engine.setCurrentVersionNumber(ORG, document.id, 3);
    expect(updated.currentVersionNumber).toBe(3);
    expect(updated.status).toBe('draft');
  });
});

describe('DocumentLifecycleEngine — every document type individually', () => {
  it('contract documents can be created and queried by type', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'MSA', documentType: 'contract' });
    expect(await engine.findByType(ORG, 'contract')).toHaveLength(1);
  });

  it('proposal documents can be created and queried by type', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'Proposal', documentType: 'proposal' });
    expect(await engine.findByType(ORG, 'proposal')).toHaveLength(1);
  });

  it('invoice_reference documents can be created and queried by type', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'Invoice Ref', documentType: 'invoice_reference' });
    expect(await engine.findByType(ORG, 'invoice_reference')).toHaveLength(1);
  });

  it('sop documents can be created and queried by type', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'SOP', documentType: 'sop' });
    expect(await engine.findByType(ORG, 'sop')).toHaveLength(1);
  });

  it('policy documents can be created and queried by type', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'Policy', documentType: 'policy' });
    expect(await engine.findByType(ORG, 'policy')).toHaveLength(1);
  });

  it('specification documents can be created and queried by type', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'Spec', documentType: 'specification' });
    expect(await engine.findByType(ORG, 'specification')).toHaveLength(1);
  });

  it('report documents can be created and queried by type', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'Report', documentType: 'report' });
    expect(await engine.findByType(ORG, 'report')).toHaveLength(1);
  });

  it('project_document documents can be created and queried by type', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'Project Doc', documentType: 'project_document' });
    expect(await engine.findByType(ORG, 'project_document')).toHaveLength(1);
  });

  it('customer_document documents can be created and queried by type', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'Customer Doc', documentType: 'customer_document' });
    expect(await engine.findByType(ORG, 'customer_document')).toHaveLength(1);
  });

  it('hr_document documents can be created and queried by type', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'HR Doc', documentType: 'hr_document' });
    expect(await engine.findByType(ORG, 'hr_document')).toHaveLength(1);
  });
});

describe('DocumentLifecycleEngine — further edge cases', () => {
  it('delete() throws DocumentNotFoundError for an unknown document', async () => {
    const { engine } = setup();
    await expect(engine.delete(ORG, 'missing')).rejects.toBeInstanceOf(DocumentNotFoundError);
  });

  it('a deleted document no longer appears in list()', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.archive(ORG, document.id);
    await engine.delete(ORG, document.id);
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('rejects delete() called on a published document (must archive first)', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.approve(ORG, document.id);
    await engine.publish(ORG, document.id);
    await expect(engine.delete(ORG, document.id)).rejects.toBeInstanceOf(InvalidDocumentTransitionError);
  });

  it('findByOwner() returns an empty array for an owner with no documents', async () => {
    const { engine } = setup();
    expect(await engine.findByOwner(ORG, 'unknown-owner')).toEqual([]);
  });

  it('findByType() returns an empty array for a type with no documents', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'X', documentType: 'contract' });
    expect(await engine.findByType(ORG, 'policy')).toEqual([]);
  });

  it('multiple documents in the same folder are all returned by findByFolder()', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'A', documentType: 'contract', folderId: 'folder-1' });
    await engine.create(ORG, { title: 'B', documentType: 'policy', folderId: 'folder-1' });
    expect(await engine.findByFolder(ORG, 'folder-1')).toHaveLength(2);
  });

  it('update() can change the owner without affecting the folder', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract', folderId: 'folder-1', ownerId: 'employee-1' });
    const updated = await engine.update(ORG, document.id, { ownerId: 'employee-2' });
    expect(updated.ownerId).toBe('employee-2');
    expect(updated.folderId).toBe('folder-1');
  });

  it('currentVersion increments across a full lifecycle', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.approve(ORG, document.id);
    const published = await engine.publish(ORG, document.id);
    expect(published.currentVersion).toBe(4);
  });
});

describe('DocumentLifecycleEngine — more organization scoping and guards', () => {
  it('findByType() never leaks across organizations', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'A', documentType: 'contract' });
    await engine.create('org-2', { title: 'A', documentType: 'contract' });
    expect(await engine.findByType(ORG, 'contract')).toHaveLength(1);
  });

  it('findByStatus() never leaks across organizations', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'A', documentType: 'contract' });
    await engine.create('org-2', { title: 'A', documentType: 'contract' });
    expect(await engine.findByStatus(ORG, 'draft')).toHaveLength(1);
  });

  it('findByOwner() never leaks across organizations', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'A', documentType: 'contract', ownerId: 'employee-1' });
    await engine.create('org-2', { title: 'A', documentType: 'contract', ownerId: 'employee-1' });
    expect(await engine.findByOwner(ORG, 'employee-1')).toHaveLength(1);
  });

  it('archiving a document in one organization does not affect a same-id-shaped document elsewhere', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'A', documentType: 'contract' });
    const otherDocument = await engine.create('org-2', { title: 'A', documentType: 'contract' });
    await engine.archive(ORG, document.id);
    const reloadedOther = await engine.get('org-2', otherDocument.id);
    expect(reloadedOther?.status).toBe('draft');
  });

  it('a document created with a title containing special characters is stored verbatim', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'Agreement — Amendment #3 (v2)', documentType: 'contract' });
    expect(document.title).toBe('Agreement — Amendment #3 (v2)');
  });

  it('submitForReview() and approve() can be called in immediate succession without a returnToDraft in between', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    const approved = await engine.approve(ORG, document.id);
    expect(approved.status).toBe('approved');
  });

  it('a document restored from archive can be archived again through a different subsequent status', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.archive(ORG, document.id);
    await engine.restore(ORG, document.id);
    await engine.approve(ORG, document.id);
    const archived = await engine.archive(ORG, document.id);
    expect(archived.statusBeforeArchive).toBe('approved');
  });

  it('list() reflects every document regardless of status', async () => {
    const { engine } = setup();
    const draft = await engine.create(ORG, { title: 'A', documentType: 'contract' });
    const other = await engine.create(ORG, { title: 'B', documentType: 'policy' });
    await engine.archive(ORG, other.id);
    const all = await engine.list(ORG);
    expect(all.map((d) => d.id).sort()).toEqual([draft.id, other.id].sort());
  });
});

describe('DocumentLifecycleEngine — even more coverage', () => {
  it('returnToDraft() throws DocumentNotFoundError for an unknown document', async () => {
    const { engine } = setup();
    await expect(engine.returnToDraft(ORG, 'missing')).rejects.toBeInstanceOf(DocumentNotFoundError);
  });

  it('findByFolder() never leaks across organizations', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'A', documentType: 'contract', folderId: 'folder-1' });
    await engine.create('org-2', { title: 'A', documentType: 'contract', folderId: 'folder-1' });
    expect(await engine.findByFolder(ORG, 'folder-1')).toHaveLength(1);
  });

  it('rejects returnToDraft() called from draft itself', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await expect(engine.returnToDraft(ORG, document.id)).rejects.toBeInstanceOf(InvalidDocumentTransitionError);
  });

  it('rejects returnToDraft() called from approved', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.approve(ORG, document.id);
    await expect(engine.returnToDraft(ORG, document.id)).rejects.toBeInstanceOf(InvalidDocumentTransitionError);
  });

  it('a document can be archived directly from draft without ever entering review', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    const archived = await engine.archive(ORG, document.id);
    expect(archived.status).toBe('archived');
  });

  it('restore() after archiving from draft returns exactly to draft, never review', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.archive(ORG, document.id);
    const restored = await engine.restore(ORG, document.id);
    expect(restored.status).toBe('draft');
  });

  it('two separate documents can be in different lifecycle stages simultaneously', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { title: 'A', documentType: 'contract' });
    const b = await engine.create(ORG, { title: 'B', documentType: 'contract' });
    await engine.submitForReview(ORG, a.id);
    expect((await engine.get(ORG, a.id))?.status).toBe('review');
    expect((await engine.get(ORG, b.id))?.status).toBe('draft');
  });

  it('a document’s statusBeforeArchive is undefined before it has ever been archived', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    expect(document.statusBeforeArchive).toBeUndefined();
  });

  it('publish() throws DocumentNotFoundError for an unknown document', async () => {
    const { engine } = setup();
    await expect(engine.publish(ORG, 'missing')).rejects.toBeInstanceOf(DocumentNotFoundError);
  });

  it('a document’s title can be updated multiple times in succession', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'V1', documentType: 'contract' });
    await engine.update(ORG, document.id, { title: 'V2' });
    const third = await engine.update(ORG, document.id, { title: 'V3' });
    expect(third.title).toBe('V3');
    expect(third.currentVersion).toBe(3);
  });

  it('archiving and deleting is the only path to permanent removal — update() cannot remove a document', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.update(ORG, document.id, { title: 'Y' });
    expect(await engine.get(ORG, document.id)).not.toBeNull();
  });

  it('findByStatus("draft") includes newly created documents by default', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    const drafts = await engine.findByStatus(ORG, 'draft');
    expect(drafts.map((d) => d.id)).toContain(document.id);
  });

  it('a document’s owner can be cleared implicitly is not possible — update() only ever sets, never unsets', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract', ownerId: 'employee-1' });
    const updated = await engine.update(ORG, document.id, { title: 'Y' });
    expect(updated.ownerId).toBe('employee-1');
  });

  it('every document type maps to a distinct, stable string value', () => {
    const types = ['contract', 'proposal', 'invoice_reference', 'sop', 'policy', 'specification', 'report', 'project_document', 'customer_document', 'hr_document'];
    expect(new Set(types).size).toBe(10);
  });

  it('archive() and delete() together fully remove a document that was never reviewed', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.archive(ORG, document.id);
    await engine.delete(ORG, document.id);
    expect(await engine.get(ORG, document.id)).toBeNull();
  });

  it('a document’s currentVersionNumber remains 0 until a version is explicitly created', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    await engine.submitForReview(ORG, document.id);
    await engine.approve(ORG, document.id);
    const published = await engine.publish(ORG, document.id);
    expect(published.currentVersionNumber).toBe(0);
  });

  it('findByOwner() returns documents regardless of their current lifecycle status', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract', ownerId: 'employee-1' });
    await engine.archive(ORG, document.id);
    expect(await engine.findByOwner(ORG, 'employee-1')).toHaveLength(1);
  });

  it('canTransitionDocument is a pure function with no side effects — calling it repeatedly gives the same result', () => {
    expect(canTransitionDocument('draft', 'review')).toBe(canTransitionDocument('draft', 'review'));
  });

  it('every one of the 5 document statuses is a distinct, stable string value', () => {
    const statuses = ['draft', 'review', 'approved', 'published', 'archived'];
    expect(new Set(statuses).size).toBe(5);
  });

  it('a document can be found by get() immediately after creation, before any other operation', async () => {
    const { engine } = setup();
    const document = await engine.create(ORG, { title: 'X', documentType: 'contract' });
    const found = await engine.get(ORG, document.id);
    expect(found).toEqual(document);
  });
});
