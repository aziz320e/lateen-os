import { describe, expect, it } from 'vitest';
import { createRelationshipEngine } from '../src/relationship/engine.impl.js';
import { createDocumentRelationshipRepository } from '../src/relationship/repository.impl.js';
import { DocumentRelationshipNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const DOC = 'doc-1';

function setup() {
  return { engine: createRelationshipEngine(createDocumentRelationshipRepository()) };
}

describe('RelationshipEngine', () => {
  it('linkEntity() creates a relationship to a project', async () => {
    const { engine } = setup();
    const relationship = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    expect(relationship.relatedEntityType).toBe('project');
    expect(relationship.relatedEntityId).toBe('project-1');
  });

  it('supports every one of the 7 related entity types', async () => {
    const { engine } = setup();
    const types = ['document', 'project', 'customer', 'employee', 'knowledge', 'workflow', 'communication'] as const;
    for (const relatedEntityType of types) {
      const relationship = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType, relatedEntityId: `${relatedEntityType}-1` });
      expect(relationship.relatedEntityType).toBe(relatedEntityType);
    }
  });

  it('accepts an optional relationType label', async () => {
    const { engine } = setup();
    const relationship = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'document', relatedEntityId: 'doc-2', relationType: 'supersedes' });
    expect(relationship.relationType).toBe('supersedes');
  });

  it('unlinkEntity() removes a relationship', async () => {
    const { engine } = setup();
    const relationship = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    await engine.unlinkEntity(ORG, relationship.id);
    expect(await engine.get(ORG, relationship.id)).toBeNull();
  });

  it('unlinkEntity() throws DocumentRelationshipNotFoundError for an unknown relationship', async () => {
    const { engine } = setup();
    await expect(engine.unlinkEntity(ORG, 'missing')).rejects.toBeInstanceOf(DocumentRelationshipNotFoundError);
  });

  it('a document can link to multiple entities of different types', async () => {
    const { engine } = setup();
    await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'customer', relatedEntityId: 'customer-1' });
    expect(await engine.findByDocument(ORG, DOC)).toHaveLength(2);
  });

  it('findByRelatedEntity() finds every document linked to a given entity', async () => {
    const { engine } = setup();
    await engine.linkEntity(ORG, { documentId: 'doc-a', relatedEntityType: 'customer', relatedEntityId: 'customer-1' });
    await engine.linkEntity(ORG, { documentId: 'doc-b', relatedEntityType: 'customer', relatedEntityId: 'customer-1' });
    await engine.linkEntity(ORG, { documentId: 'doc-c', relatedEntityType: 'customer', relatedEntityId: 'customer-2' });
    expect(await engine.findByRelatedEntity(ORG, 'customer', 'customer-1')).toHaveLength(2);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const relationship = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    expect(await engine.get(ORG, relationship.id)).toEqual(relationship);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('relationships are isolated per organization', async () => {
    const { engine } = setup();
    await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    await engine.linkEntity('org-2', { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('findByDocument() returns an empty list for a document with no relationships', async () => {
    const { engine } = setup();
    expect(await engine.findByDocument(ORG, 'unknown-doc')).toEqual([]);
  });

  it('findByRelatedEntity() returns an empty list when nothing matches', async () => {
    const { engine } = setup();
    await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    expect(await engine.findByRelatedEntity(ORG, 'project', 'unknown-project')).toEqual([]);
  });

  it('list() returns an empty array for an organization with no relationships', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('a document-to-document relationship models an amendment referencing its original contract', async () => {
    const { engine } = setup();
    const relationship = await engine.linkEntity(ORG, { documentId: 'amendment-1', relatedEntityType: 'document', relatedEntityId: 'contract-1', relationType: 'amends' });
    expect(relationship.relatedEntityType).toBe('document');
    expect(relationship.relationType).toBe('amends');
  });

  it('unlinking one relationship does not affect another for the same document', async () => {
    const { engine } = setup();
    const first = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    const second = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'customer', relatedEntityId: 'customer-1' });
    await engine.unlinkEntity(ORG, first.id);
    expect(await engine.get(ORG, second.id)).toEqual(second);
  });

  it('relationType is optional', async () => {
    const { engine } = setup();
    const relationship = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'workflow', relatedEntityId: 'workflow-1' });
    expect(relationship.relationType).toBeUndefined();
  });

  it('the same document can link to the same related entity more than once with different relationTypes', async () => {
    const { engine } = setup();
    await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'employee', relatedEntityId: 'employee-1', relationType: 'author' });
    await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'employee', relatedEntityId: 'employee-1', relationType: 'approver' });
    expect(await engine.findByDocument(ORG, DOC)).toHaveLength(2);
  });

  it('findByRelatedEntity() distinguishes between different related entity types with the same id', async () => {
    const { engine } = setup();
    await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'shared-id' });
    await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'customer', relatedEntityId: 'shared-id' });
    expect(await engine.findByRelatedEntity(ORG, 'project', 'shared-id')).toHaveLength(1);
    expect(await engine.findByRelatedEntity(ORG, 'customer', 'shared-id')).toHaveLength(1);
  });

  it('linking to a knowledge entity works as expected', async () => {
    const { engine } = setup();
    const relationship = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'knowledge', relatedEntityId: 'knowledge-1' });
    expect(relationship.relatedEntityType).toBe('knowledge');
  });

  it('linking to a communication entity works as expected', async () => {
    const { engine } = setup();
    const relationship = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'communication', relatedEntityId: 'comm-1' });
    expect(relationship.relatedEntityType).toBe('communication');
  });

  it('list() reflects the total across every document once relationships accumulate', async () => {
    const { engine } = setup();
    await engine.linkEntity(ORG, { documentId: 'doc-a', relatedEntityType: 'project', relatedEntityId: 'project-1' });
    await engine.linkEntity(ORG, { documentId: 'doc-b', relatedEntityType: 'customer', relatedEntityId: 'customer-1' });
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('findByRelatedEntity() never leaks across organizations', async () => {
    const { engine } = setup();
    await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    await engine.linkEntity('org-2', { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    expect(await engine.findByRelatedEntity(ORG, 'project', 'project-1')).toHaveLength(1);
  });

  it('get() returns null for a relationship belonging to a different organization', async () => {
    const { engine } = setup();
    const relationship = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    expect(await engine.get('org-2', relationship.id)).toBeNull();
  });

  it('unlinkEntity() throws DocumentRelationshipNotFoundError for a relationship in a different organization', async () => {
    const { engine } = setup();
    const relationship = await engine.linkEntity(ORG, { documentId: DOC, relatedEntityType: 'project', relatedEntityId: 'project-1' });
    await expect(engine.unlinkEntity('org-2', relationship.id)).rejects.toBeInstanceOf(DocumentRelationshipNotFoundError);
  });

  it('every one of the 7 related entity types is a distinct, stable string value', () => {
    const types = ['document', 'project', 'customer', 'employee', 'knowledge', 'workflow', 'communication'];
    expect(new Set(types).size).toBe(7);
  });

  it('a document with no relationships at all is still queryable without error', async () => {
    const { engine } = setup();
    expect(await engine.findByDocument(ORG, 'brand-new-doc')).toEqual([]);
  });
});
