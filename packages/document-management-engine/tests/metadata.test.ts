import { describe, expect, it } from 'vitest';
import { createDocumentManagementEventBus } from '../src/events/index.js';
import { createMetadataEngine, isExpired } from '../src/metadata/engine.impl.js';
import { createDocumentMetadataRepository } from '../src/metadata/repository.impl.js';

const ORG = 'org-1';
const DOC = 'doc-1';

function setup() {
  const eventBus = createDocumentManagementEventBus();
  const engine = createMetadataEngine(createDocumentMetadataRepository(), eventBus);
  return { engine, eventBus };
}

describe('isExpired (pure)', () => {
  it('returns false when no expiryDate is set', () => {
    expect(isExpired(undefined, '2026-01-01')).toBe(false);
  });

  it('returns true when asOfDate is on or after expiryDate', () => {
    expect(isExpired('2026-01-01', '2026-01-01')).toBe(true);
    expect(isExpired('2026-01-01', '2026-01-02')).toBe(true);
  });

  it('returns false when asOfDate precedes expiryDate', () => {
    expect(isExpired('2026-01-10', '2026-01-01')).toBe(false);
  });
});

describe('MetadataEngine — upsertMetadata', () => {
  it('creates a fresh metadata record on first upsert', async () => {
    const { engine } = setup();
    const metadata = await engine.upsertMetadata(ORG, { documentId: DOC, tags: ['urgent'], categories: ['legal'] });
    expect(metadata.tags).toEqual(['urgent']);
    expect(metadata.categories).toEqual(['legal']);
    expect(metadata.expired).toBe(false);
  });

  it('upserting again updates the existing record rather than creating a second one', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC, tags: ['urgent'] });
    const updated = await engine.upsertMetadata(ORG, { documentId: DOC, categories: ['legal'] });
    expect(updated.tags).toEqual(['urgent']);
    expect(updated.categories).toEqual(['legal']);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('accepts retentionDays and expiryDate', async () => {
    const { engine } = setup();
    const metadata = await engine.upsertMetadata(ORG, { documentId: DOC, retentionDays: 365, expiryDate: '2027-01-01' });
    expect(metadata.retentionDays).toBe(365);
    expect(metadata.expiryDate).toBe('2027-01-01');
  });

  it('accepts multiple owners', async () => {
    const { engine } = setup();
    const metadata = await engine.upsertMetadata(ORG, { documentId: DOC, owners: ['employee-1', 'employee-2'] });
    expect(metadata.owners).toEqual(['employee-1', 'employee-2']);
  });
});

describe('MetadataEngine — tags and categories', () => {
  it('addTag() appends a new tag', async () => {
    const { engine } = setup();
    const metadata = await engine.addTag(ORG, DOC, 'urgent');
    expect(metadata.tags).toEqual(['urgent']);
  });

  it('addTag() is idempotent for an already-present tag', async () => {
    const { engine } = setup();
    await engine.addTag(ORG, DOC, 'urgent');
    const again = await engine.addTag(ORG, DOC, 'urgent');
    expect(again.tags).toEqual(['urgent']);
  });

  it('removeTag() drops a tag', async () => {
    const { engine } = setup();
    await engine.addTag(ORG, DOC, 'urgent');
    const updated = await engine.removeTag(ORG, DOC, 'urgent');
    expect(updated.tags).toEqual([]);
  });

  it('addCategory() / removeCategory() mirror addTag()/removeTag()', async () => {
    const { engine } = setup();
    await engine.addCategory(ORG, DOC, 'legal');
    const updated = await engine.removeCategory(ORG, DOC, 'legal');
    expect(updated.categories).toEqual([]);
  });

  it('a document can accumulate multiple tags and categories', async () => {
    const { engine } = setup();
    await engine.addTag(ORG, DOC, 'urgent');
    await engine.addTag(ORG, DOC, 'confidential');
    const updated = await engine.addCategory(ORG, DOC, 'legal');
    expect(updated.tags).toEqual(['urgent', 'confidential']);
  });
});

describe('MetadataEngine — checkExpiry', () => {
  it('returns false and does not publish when no expiryDate is set', async () => {
    const { engine, eventBus } = setup();
    let published = false;
    eventBus.subscribe('document.expired', () => (published = true));
    const expired = await engine.checkExpiry(ORG, DOC, '2026-01-01');
    expect(expired).toBe(false);
    expect(published).toBe(false);
  });

  it('returns true and publishes document.expired the first time a document expires', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('document.expired', (payload) => (seen = payload));
    await engine.upsertMetadata(ORG, { documentId: DOC, expiryDate: '2026-01-01' });
    const expired = await engine.checkExpiry(ORG, DOC, '2026-06-01');
    expect(expired).toBe(true);
    expect(seen).toEqual({ organizationId: ORG, documentId: DOC });
  });

  it('does not re-publish document.expired on subsequent checks', async () => {
    const { engine, eventBus } = setup();
    let publishCount = 0;
    eventBus.subscribe('document.expired', () => (publishCount += 1));
    await engine.upsertMetadata(ORG, { documentId: DOC, expiryDate: '2026-01-01' });
    await engine.checkExpiry(ORG, DOC, '2026-06-01');
    await engine.checkExpiry(ORG, DOC, '2026-07-01');
    expect(publishCount).toBe(1);
  });

  it('returns false before the expiry date arrives', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC, expiryDate: '2027-01-01' });
    expect(await engine.checkExpiry(ORG, DOC, '2026-01-01')).toBe(false);
  });
});

describe('MetadataEngine — queries', () => {
  it('findByDocument() returns null for a document with no metadata', async () => {
    const { engine } = setup();
    expect(await engine.findByDocument(ORG, 'unknown-doc')).toBeNull();
  });

  it('findByCategory() / findByTag() filter correctly', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: 'doc-a', tags: ['urgent'], categories: ['legal'] });
    await engine.upsertMetadata(ORG, { documentId: 'doc-b', tags: ['low-priority'], categories: ['hr'] });
    expect(await engine.findByCategory(ORG, 'legal')).toHaveLength(1);
    expect(await engine.findByTag(ORG, 'urgent')).toHaveLength(1);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const metadata = await engine.upsertMetadata(ORG, { documentId: DOC });
    expect(await engine.get(ORG, metadata.id)).toEqual(metadata);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('metadata is isolated per organization', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC });
    await engine.upsertMetadata('org-2', { documentId: DOC });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('findByCategory() returns an empty array when no metadata matches', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC, categories: ['legal'] });
    expect(await engine.findByCategory(ORG, 'hr')).toEqual([]);
  });

  it('findByTag() returns an empty array when no metadata matches', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC, tags: ['urgent'] });
    expect(await engine.findByTag(ORG, 'low-priority')).toEqual([]);
  });

  it('list() returns an empty array for an organization with no metadata', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });
});

describe('MetadataEngine — additional edge cases', () => {
  it('addTag()/addCategory() auto-create the metadata record if none exists yet', async () => {
    const { engine } = setup();
    const metadata = await engine.addTag(ORG, DOC, 'urgent');
    expect(metadata.documentId).toBe(DOC);
    expect(metadata.expired).toBe(false);
  });

  it('removeTag() on a document with no metadata auto-creates a record with an empty tags array', async () => {
    const { engine } = setup();
    const metadata = await engine.removeTag(ORG, DOC, 'nonexistent-tag');
    expect(metadata.tags).toEqual([]);
  });

  it('checkExpiry() auto-creates metadata for a document that has none, treating it as not expired', async () => {
    const { engine } = setup();
    const expired = await engine.checkExpiry(ORG, DOC, '2026-01-01');
    expect(expired).toBe(false);
  });

  it('a metadata record can independently track two different documents', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: 'doc-a', tags: ['a-tag'] });
    await engine.upsertMetadata(ORG, { documentId: 'doc-b', tags: ['b-tag'] });
    const metaA = await engine.findByDocument(ORG, 'doc-a');
    const metaB = await engine.findByDocument(ORG, 'doc-b');
    expect(metaA?.tags).toEqual(['a-tag']);
    expect(metaB?.tags).toEqual(['b-tag']);
  });

  it('checkExpiry() exactly on the expiry date returns true', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC, expiryDate: '2026-03-15' });
    expect(await engine.checkExpiry(ORG, DOC, '2026-03-15')).toBe(true);
  });

  it('upsertMetadata() called with only retentionDays leaves tags/categories untouched', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC, tags: ['urgent'] });
    const updated = await engine.upsertMetadata(ORG, { documentId: DOC, retentionDays: 90 });
    expect(updated.tags).toEqual(['urgent']);
    expect(updated.retentionDays).toBe(90);
  });

  it('metadata for two documents in the same organization are independently expirable', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: 'doc-a', expiryDate: '2026-01-01' });
    await engine.upsertMetadata(ORG, { documentId: 'doc-b', expiryDate: '2027-01-01' });
    expect(await engine.checkExpiry(ORG, 'doc-a', '2026-06-01')).toBe(true);
    expect(await engine.checkExpiry(ORG, 'doc-b', '2026-06-01')).toBe(false);
  });

  it('addTag() and addCategory() on the same document accumulate independently', async () => {
    const { engine } = setup();
    await engine.addTag(ORG, DOC, 'urgent');
    const updated = await engine.addCategory(ORG, DOC, 'legal');
    expect(updated.tags).toEqual(['urgent']);
    expect(updated.categories).toEqual(['legal']);
  });

  it('removeTag() on a tag that was never added is a safe no-op', async () => {
    const { engine } = setup();
    await engine.addTag(ORG, DOC, 'urgent');
    const updated = await engine.removeTag(ORG, DOC, 'never-added');
    expect(updated.tags).toEqual(['urgent']);
  });

  it('removeCategory() on a category that was never added is a safe no-op', async () => {
    const { engine } = setup();
    await engine.addCategory(ORG, DOC, 'legal');
    const updated = await engine.removeCategory(ORG, DOC, 'never-added');
    expect(updated.categories).toEqual(['legal']);
  });

  it('upsertMetadata() can clear a previously set retentionDays back to undefined only by omission (not explicit clearing)', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC, retentionDays: 30 });
    const updated = await engine.upsertMetadata(ORG, { documentId: DOC, tags: ['x'] });
    expect(updated.retentionDays).toBe(30);
  });

  it('findByCategory() never leaks across organizations', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC, categories: ['legal'] });
    await engine.upsertMetadata('org-2', { documentId: DOC, categories: ['legal'] });
    expect(await engine.findByCategory(ORG, 'legal')).toHaveLength(1);
  });

  it('findByTag() never leaks across organizations', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC, tags: ['urgent'] });
    await engine.upsertMetadata('org-2', { documentId: DOC, tags: ['urgent'] });
    expect(await engine.findByTag(ORG, 'urgent')).toHaveLength(1);
  });

  it('a document can carry both an expiryDate and a retentionDays value simultaneously', async () => {
    const { engine } = setup();
    const metadata = await engine.upsertMetadata(ORG, { documentId: DOC, expiryDate: '2027-01-01', retentionDays: 730 });
    expect(metadata.expiryDate).toBe('2027-01-01');
    expect(metadata.retentionDays).toBe(730);
  });

  it('checkExpiry() one day before expiry returns false', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC, expiryDate: '2026-03-15' });
    expect(await engine.checkExpiry(ORG, DOC, '2026-03-14')).toBe(false);
  });

  it('get() returns null for metadata belonging to a different organization', async () => {
    const { engine } = setup();
    const metadata = await engine.upsertMetadata(ORG, { documentId: DOC });
    expect(await engine.get('org-2', metadata.id)).toBeNull();
  });

  it('addTag() twice with different tags accumulates both', async () => {
    const { engine } = setup();
    await engine.addTag(ORG, DOC, 'first');
    const updated = await engine.addTag(ORG, DOC, 'second');
    expect(updated.tags).toEqual(['first', 'second']);
  });

  it('a document’s owners list can hold more than the document’s single primary ownerId', async () => {
    const { engine } = setup();
    const metadata = await engine.upsertMetadata(ORG, { documentId: DOC, owners: ['employee-1', 'employee-2', 'employee-3'] });
    expect(metadata.owners).toHaveLength(3);
  });

  it('addCategory() twice with different categories accumulates both', async () => {
    const { engine } = setup();
    await engine.addCategory(ORG, DOC, 'legal');
    const updated = await engine.addCategory(ORG, DOC, 'compliance');
    expect(updated.categories).toEqual(['legal', 'compliance']);
  });

  it('metadata created via addTag() has expired: false by default', async () => {
    const { engine } = setup();
    const metadata = await engine.addTag(ORG, DOC, 'x');
    expect(metadata.expired).toBe(false);
  });

  it('findByDocument() reflects the very latest upsert', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC, tags: ['v1'] });
    await engine.upsertMetadata(ORG, { documentId: DOC, tags: ['v2'] });
    const metadata = await engine.findByDocument(ORG, DOC);
    expect(metadata?.tags).toEqual(['v2']);
  });

  it('a freshly created metadata record via upsertMetadata() has an empty owners list by default', async () => {
    const { engine } = setup();
    const metadata = await engine.upsertMetadata(ORG, { documentId: DOC, tags: ['x'] });
    expect(metadata.owners).toEqual([]);
  });

  it('checkExpiry() called repeatedly on a non-expiring document always returns false', async () => {
    const { engine } = setup();
    await engine.upsertMetadata(ORG, { documentId: DOC });
    expect(await engine.checkExpiry(ORG, DOC, '2026-01-01')).toBe(false);
    expect(await engine.checkExpiry(ORG, DOC, '2030-01-01')).toBe(false);
  });
});
