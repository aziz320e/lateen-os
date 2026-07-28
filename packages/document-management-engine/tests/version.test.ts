import { describe, expect, it } from 'vitest';
import { createDocumentLifecycleEngine } from '../src/document/engine.impl.js';
import { createDocumentRepository } from '../src/document/repository.impl.js';
import { createDocumentManagementEventBus } from '../src/events/index.js';
import { createVersionControlEngine } from '../src/version/engine.impl.js';
import { createDocumentVersionRepository } from '../src/version/repository.impl.js';
import { DocumentNotFoundError, DocumentVersionNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createDocumentManagementEventBus();
  const documents = createDocumentLifecycleEngine(createDocumentRepository(), eventBus);
  const versions = createVersionControlEngine(createDocumentVersionRepository(), documents, eventBus);
  return { documents, versions, eventBus };
}

describe('VersionControlEngine — createVersion', () => {
  it('creates version 1 for a fresh document and updates its currentVersionNumber', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    const version = await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    expect(version.versionNumber).toBe(1);
    const reloaded = await documents.get(ORG, document.id);
    expect(reloaded?.currentVersionNumber).toBe(1);
  });

  it('successive versions increment monotonically', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    const second = await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-2' });
    expect(second.versionNumber).toBe(2);
  });

  it('publishes document.version.created', async () => {
    const { documents, versions, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('document.version.created', (payload) => (seen = payload));
    const document = await documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    const version = await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    expect(seen).toEqual({ organizationId: ORG, documentId: document.id, versionId: version.id, versionNumber: 1 });
  });

  it('accepts optional changeNotes and createdBy', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    const version = await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1', changeNotes: 'Initial draft', createdBy: 'employee-1' });
    expect(version.changeNotes).toBe('Initial draft');
    expect(version.createdBy).toBe('employee-1');
  });

  it('throws DocumentNotFoundError for an unknown document', async () => {
    const { versions } = setup();
    await expect(versions.createVersion(ORG, { documentId: 'missing', contentRef: 'blob-1' })).rejects.toBeInstanceOf(DocumentNotFoundError);
  });

  it('version numbering is independent per document', async () => {
    const { documents, versions } = setup();
    const a = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    const b = await documents.create(ORG, { title: 'B', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: a.id, contentRef: 'blob-a1' });
    await versions.createVersion(ORG, { documentId: a.id, contentRef: 'blob-a2' });
    const firstForB = await versions.createVersion(ORG, { documentId: b.id, contentRef: 'blob-b1' });
    expect(firstForB.versionNumber).toBe(1);
  });
});

describe('VersionControlEngine — compareVersions', () => {
  it('reports changed: true when content differs', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-2' });
    const comparison = await versions.compareVersions(ORG, document.id, 1, 2);
    expect(comparison.changed).toBe(true);
    expect(comparison.contentRefA).toBe('blob-1');
    expect(comparison.contentRefB).toBe('blob-2');
  });

  it('reports changed: false when content is identical', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    const comparison = await versions.compareVersions(ORG, document.id, 1, 2);
    expect(comparison.changed).toBe(false);
  });

  it('includes changeNotes from both versions', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1', changeNotes: 'v1 notes' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-2', changeNotes: 'v2 notes' });
    const comparison = await versions.compareVersions(ORG, document.id, 1, 2);
    expect(comparison.changeNotesA).toBe('v1 notes');
    expect(comparison.changeNotesB).toBe('v2 notes');
  });

  it('throws DocumentVersionNotFoundError when either version is unknown', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    await expect(versions.compareVersions(ORG, document.id, 1, 99)).rejects.toBeInstanceOf(DocumentVersionNotFoundError);
  });
});

describe('VersionControlEngine — restoreVersion', () => {
  it('restoreVersion() moves the currentVersionNumber pointer without deleting later versions', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-2' });
    const restored = await versions.restoreVersion(ORG, document.id, 1);
    expect(restored.currentVersionNumber).toBe(1);
    expect(await versions.findByDocument(ORG, document.id)).toHaveLength(2);
  });

  it('restoreVersion() throws DocumentVersionNotFoundError for an unknown version number', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'MSA', documentType: 'contract' });
    await expect(versions.restoreVersion(ORG, document.id, 5)).rejects.toBeInstanceOf(DocumentVersionNotFoundError);
  });
});

describe('VersionControlEngine — queries', () => {
  it('findByDocument() returns only that document’s versions', async () => {
    const { documents, versions } = setup();
    const a = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    const b = await documents.create(ORG, { title: 'B', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: a.id, contentRef: 'blob-a' });
    await versions.createVersion(ORG, { documentId: b.id, contentRef: 'blob-b' });
    expect(await versions.findByDocument(ORG, a.id)).toHaveLength(1);
  });

  it('get()/list() work as expected', async () => {
    const { documents, versions } = setup();
    expect(await versions.get(ORG, 'missing')).toBeNull();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    const version = await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    expect(await versions.get(ORG, version.id)).toEqual(version);
    expect(await versions.list(ORG)).toHaveLength(1);
  });

  it('versions are immutable — findByDocument returns the exact persisted records across calls', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    const version = await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    const [reloaded] = await versions.findByDocument(ORG, document.id);
    expect(reloaded).toEqual(version);
  });

  it('list() returns an empty array for an organization with no versions', async () => {
    const { versions } = setup();
    expect(await versions.list(ORG)).toEqual([]);
  });

  it('findByDocument() returns an empty array for a document with no versions', async () => {
    const { versions } = setup();
    expect(await versions.findByDocument(ORG, 'unknown-doc')).toEqual([]);
  });

  it('versions are isolated per organization', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    const otherDocument = await documents.create('org-2', { title: 'A', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    await versions.createVersion('org-2', { documentId: otherDocument.id, contentRef: 'blob-1' });
    expect(await versions.list(ORG)).toHaveLength(1);
    expect(await versions.list('org-2')).toHaveLength(1);
  });
});

describe('VersionControlEngine — additional edge cases', () => {
  it('restoreVersion() can move the pointer forward as well as backward', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-2' });
    await versions.restoreVersion(ORG, document.id, 1);
    const forward = await versions.restoreVersion(ORG, document.id, 2);
    expect(forward.currentVersionNumber).toBe(2);
  });

  it('compareVersions() works when comparing a version against itself', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    const comparison = await versions.compareVersions(ORG, document.id, 1, 1);
    expect(comparison.changed).toBe(false);
  });

  it('createVersion() without changeNotes/createdBy leaves them undefined', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    const version = await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    expect(version.changeNotes).toBeUndefined();
    expect(version.createdBy).toBeUndefined();
  });

  it('a document can accumulate many versions with monotonically increasing numbers', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    for (let i = 1; i <= 5; i += 1) {
      const version = await versions.createVersion(ORG, { documentId: document.id, contentRef: `blob-${i}` });
      expect(version.versionNumber).toBe(i);
    }
    expect(await versions.findByDocument(ORG, document.id)).toHaveLength(5);
  });

  it('restoreVersion() throws DocumentVersionNotFoundError even for version 0', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    await expect(versions.restoreVersion(ORG, document.id, 0)).rejects.toBeInstanceOf(DocumentVersionNotFoundError);
  });

  it('createVersion() does not affect a different document’s currentVersionNumber', async () => {
    const { documents, versions } = setup();
    const a = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    const b = await documents.create(ORG, { title: 'B', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: a.id, contentRef: 'blob-a' });
    const reloadedB = await documents.get(ORG, b.id);
    expect(reloadedB?.currentVersionNumber).toBe(0);
  });

  it('compareVersions() with reversed argument order still reports the same changed flag', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-2' });
    const forward = await versions.compareVersions(ORG, document.id, 1, 2);
    const backward = await versions.compareVersions(ORG, document.id, 2, 1);
    expect(forward.changed).toBe(backward.changed);
  });

  it('createVersion() with identical contentRef across versions still increments versionNumber', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'same-blob' });
    const second = await versions.createVersion(ORG, { documentId: document.id, contentRef: 'same-blob' });
    expect(second.versionNumber).toBe(2);
  });

  it('a version’s organizationId matches the document’s organization', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    const version = await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    expect(version.organizationId).toBe(ORG);
  });

  it('restoreVersion() to the current version number is a safe no-op', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    const restored = await versions.restoreVersion(ORG, document.id, 1);
    expect(restored.currentVersionNumber).toBe(1);
  });

  it('compareVersions() throws DocumentVersionNotFoundError for a document with no versions at all', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    await expect(versions.compareVersions(ORG, document.id, 1, 2)).rejects.toBeInstanceOf(DocumentVersionNotFoundError);
  });

  it('a version created for one document cannot be found under another document’s id', async () => {
    const { documents, versions } = setup();
    const a = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    const b = await documents.create(ORG, { title: 'B', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: a.id, contentRef: 'blob-a' });
    await expect(versions.restoreVersion(ORG, b.id, 1)).rejects.toBeInstanceOf(DocumentVersionNotFoundError);
  });

  it('three consecutive versions can each be independently compared', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-2' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-3' });
    const oneToThree = await versions.compareVersions(ORG, document.id, 1, 3);
    expect(oneToThree.changed).toBe(true);
  });

  it('get() returns null for a version belonging to a different organization', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    const version = await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    expect(await versions.get('org-2', version.id)).toBeNull();
  });

  it('restoreVersion() after multiple restores in a row still resolves correctly', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-1' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-2' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'blob-3' });
    await versions.restoreVersion(ORG, document.id, 1);
    await versions.restoreVersion(ORG, document.id, 3);
    const final = await versions.restoreVersion(ORG, document.id, 2);
    expect(final.currentVersionNumber).toBe(2);
  });

  it('createVersion() throws DocumentNotFoundError for a document belonging to a different organization', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    await expect(versions.createVersion('org-2', { documentId: document.id, contentRef: 'blob-1' })).rejects.toBeInstanceOf(DocumentNotFoundError);
  });

  it('compareVersions() correctly reports unchanged content across three identical versions', async () => {
    const { documents, versions } = setup();
    const document = await documents.create(ORG, { title: 'A', documentType: 'contract' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'same' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'same' });
    await versions.createVersion(ORG, { documentId: document.id, contentRef: 'same' });
    const comparison = await versions.compareVersions(ORG, document.id, 1, 3);
    expect(comparison.changed).toBe(false);
  });
});
