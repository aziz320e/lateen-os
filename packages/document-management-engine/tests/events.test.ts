import { describe, expect, it } from 'vitest';
import { createDocumentManagementEventBus, DOCUMENT_MANAGEMENT_EVENT_NAMES } from '../src/events/index.js';

describe('DocumentManagementEventBus', () => {
  it('publishes and delivers events by name', () => {
    const bus = createDocumentManagementEventBus();
    let seen: unknown;
    bus.subscribe('document.created', (payload) => (seen = payload));
    bus.publish('document.created', { organizationId: 'org-1', documentId: 'doc-1', title: 'MSA' });
    expect(seen).toEqual({ organizationId: 'org-1', documentId: 'doc-1', title: 'MSA' });
  });

  it('subscribeAll() receives every event regardless of name', () => {
    const bus = createDocumentManagementEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('document.reviewed', { organizationId: 'org-1', documentId: 'doc-1' });
    bus.publish('document.approved', { organizationId: 'org-1', documentId: 'doc-1' });
    expect(names).toEqual(['document.reviewed', 'document.approved']);
  });

  it('unsubscribe stops delivery', () => {
    const bus = createDocumentManagementEventBus();
    let count = 0;
    const unsubscribe = bus.subscribe('document.published', () => (count += 1));
    bus.publish('document.published', { organizationId: 'org-1', documentId: 'doc-1' });
    unsubscribe();
    bus.publish('document.published', { organizationId: 'org-1', documentId: 'doc-1' });
    expect(count).toBe(1);
  });

  it('delivers document.updated with its payload', () => {
    const bus = createDocumentManagementEventBus();
    let seen: unknown;
    bus.subscribe('document.updated', (payload) => (seen = payload));
    bus.publish('document.updated', { organizationId: 'org-1', documentId: 'doc-1' });
    expect(seen).toEqual({ organizationId: 'org-1', documentId: 'doc-1' });
  });

  it('delivers document.archived and document.restored with their payloads', () => {
    const bus = createDocumentManagementEventBus();
    const seen: unknown[] = [];
    bus.subscribe('document.archived', (payload) => seen.push(payload));
    bus.subscribe('document.restored', (payload) => seen.push(payload));
    bus.publish('document.archived', { organizationId: 'org-1', documentId: 'doc-1' });
    bus.publish('document.restored', { organizationId: 'org-1', documentId: 'doc-1' });
    expect(seen).toHaveLength(2);
  });

  it('delivers document.version.created with its payload', () => {
    const bus = createDocumentManagementEventBus();
    let seen: unknown;
    bus.subscribe('document.version.created', (payload) => (seen = payload));
    bus.publish('document.version.created', { organizationId: 'org-1', documentId: 'doc-1', versionId: 'ver-1', versionNumber: 1 });
    expect(seen).toEqual({ organizationId: 'org-1', documentId: 'doc-1', versionId: 'ver-1', versionNumber: 1 });
  });

  it('delivers document.expired with its payload', () => {
    const bus = createDocumentManagementEventBus();
    let seen: unknown;
    bus.subscribe('document.expired', (payload) => (seen = payload));
    bus.publish('document.expired', { organizationId: 'org-1', documentId: 'doc-1' });
    expect(seen).toEqual({ organizationId: 'org-1', documentId: 'doc-1' });
  });

  it('delivers document.deleted with its payload', () => {
    const bus = createDocumentManagementEventBus();
    let seen: unknown;
    bus.subscribe('document.deleted', (payload) => (seen = payload));
    bus.publish('document.deleted', { organizationId: 'org-1', documentId: 'doc-1' });
    expect(seen).toEqual({ organizationId: 'org-1', documentId: 'doc-1' });
  });

  it('multiple independent subscribers to the same event all receive it', () => {
    const bus = createDocumentManagementEventBus();
    let countA = 0;
    let countB = 0;
    bus.subscribe('document.created', () => (countA += 1));
    bus.subscribe('document.created', () => (countB += 1));
    bus.publish('document.created', { organizationId: 'org-1', documentId: 'doc-1', title: 'MSA' });
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  });

  it('delivers document.reviewed and document.approved independently', () => {
    const bus = createDocumentManagementEventBus();
    const seen: string[] = [];
    bus.subscribe('document.reviewed', () => seen.push('reviewed'));
    bus.subscribe('document.approved', () => seen.push('approved'));
    bus.publish('document.reviewed', { organizationId: 'org-1', documentId: 'doc-1' });
    bus.publish('document.approved', { organizationId: 'org-1', documentId: 'doc-1' });
    expect(seen).toEqual(['reviewed', 'approved']);
  });

  it('DOCUMENT_MANAGEMENT_EVENT_NAMES values are unique', () => {
    const values = Object.values(DOCUMENT_MANAGEMENT_EVENT_NAMES);
    expect(new Set(values).size).toBe(values.length);
  });

  it('DOCUMENT_MANAGEMENT_EVENT_NAMES exposes all 10 canonical event names', () => {
    expect(Object.values(DOCUMENT_MANAGEMENT_EVENT_NAMES)).toEqual([
      'document.created',
      'document.updated',
      'document.reviewed',
      'document.approved',
      'document.published',
      'document.archived',
      'document.restored',
      'document.version.created',
      'document.expired',
      'document.deleted',
    ]);
  });
});
