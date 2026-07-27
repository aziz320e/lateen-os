import { describe, expect, it } from 'vitest';
import { createDomainGraphRuntime } from '@lateen-os/domain-graph';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import { createCustomerRepository } from '../src/customer/repository.impl.js';
import { createCustomerLifecycle } from '../src/customer/lifecycle.impl.js';
import { createLeadRepository } from '../src/lead/repository.impl.js';
import { createLeadLifecycle } from '../src/lead/lifecycle.impl.js';
import { createContactRepository } from '../src/contact/repository.impl.js';
import { createContactManagement } from '../src/contact/service.impl.js';
import { createActivityRepository } from '../src/activity/repository.impl.js';
import { createActivityTimeline } from '../src/activity/timeline.impl.js';

const ORG = 'org-1';

describe('createRelationshipManagement without collaborators', () => {
  it('every method degrades to null when nothing is injected', async () => {
    const relationships = createRelationshipManagement({});
    const customer = await createCustomerLifecycle(createCustomerRepository()).create(ORG, { name: 'Acme Corp' });
    const activity = await createActivityTimeline(createActivityRepository()).log(ORG, {
      activityType: 'call',
      subject: 'Kickoff',
      relatedTo: { entityType: 'customer', entityId: customer.id },
    });

    expect(await relationships.syncCustomerToGraph(ORG, 'graph-1', customer)).toBeNull();
    expect(await relationships.linkEntities(ORG, 'graph-1', 'node-1', 'node-2', 'related_to')).toBeNull();
    expect(await relationships.logActivityToMemory(ORG, activity)).toBeNull();
  });
});

describe('createRelationshipManagement with real Domain Graph and Institutional Memory runtimes', () => {
  async function setup() {
    const domainGraphRuntime = createDomainGraphRuntime();
    const institutionalMemoryRuntime = createInstitutionalMemoryRuntime();
    const graph = await domainGraphRuntime.graphs.create(ORG, { name: 'CRM Graph' });

    const relationships = createRelationshipManagement({
      domainGraph: domainGraphRuntime,
      institutionalMemory: institutionalMemoryRuntime,
    });

    const customerLifecycle = createCustomerLifecycle(createCustomerRepository());
    const leadLifecycle = createLeadLifecycle(createLeadRepository(), customerLifecycle);
    const contactManagement = createContactManagement(createContactRepository());
    const activityTimeline = createActivityTimeline(createActivityRepository());

    return { domainGraphRuntime, institutionalMemoryRuntime, graph, relationships, customerLifecycle, leadLifecycle, contactManagement, activityTimeline };
  }

  it('syncCustomerToGraph() registers a real Domain Graph customer node', async () => {
    const { relationships, customerLifecycle, graph, domainGraphRuntime } = await setup();
    const customer = await customerLifecycle.create(ORG, { name: 'Acme Corp' });

    const node = await relationships.syncCustomerToGraph(ORG, graph.id, customer);
    expect(node).not.toBeNull();
    expect(node?.nodeType).toBe('customer');
    expect(node?.entityId).toBe(customer.id);
    expect(node?.label).toBe('Acme Corp');

    const persisted = await domainGraphRuntime.entities.get(ORG, graph.id, node!.nodeId);
    expect(persisted).not.toBeNull();
  });

  it('syncCustomerToGraph() is idempotent — a second sync updates rather than duplicates', async () => {
    const { relationships, customerLifecycle, graph, domainGraphRuntime } = await setup();
    const customer = await customerLifecycle.create(ORG, { name: 'Acme Corp' });

    const first = await relationships.syncCustomerToGraph(ORG, graph.id, customer);
    const updatedCustomer = await customerLifecycle.update(ORG, customer.id, { name: 'Acme Corporation' });
    const second = await relationships.syncCustomerToGraph(ORG, graph.id, updatedCustomer);

    expect(second?.nodeId).toBe(first?.nodeId);
    expect(second?.label).toBe('Acme Corporation');

    const allNodes = await domainGraphRuntime.entities.list(ORG, graph.id);
    expect(allNodes.filter((node) => node.nodeType === 'customer' && node.entityId === customer.id)).toHaveLength(1);
  });

  it('syncLeadToGraph() registers a real Domain Graph lead node', async () => {
    const { relationships, leadLifecycle, graph } = await setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee' });

    const node = await relationships.syncLeadToGraph(ORG, graph.id, lead);
    expect(node?.nodeType).toBe('lead');
    expect(node?.entityId).toBe(lead.id);
  });

  it('syncContactToGraph() registers a real Domain Graph contact node with a joined label', async () => {
    const { relationships, contactManagement, graph } = await setup();
    const contact = await contactManagement.create(ORG, { firstName: 'Ada', lastName: 'Lovelace' });

    const node = await relationships.syncContactToGraph(ORG, graph.id, contact);
    expect(node?.nodeType).toBe('contact');
    expect(node?.label).toBe('Ada Lovelace');
  });

  it('linkEntities() creates a real Domain Graph relationship between two synced entities', async () => {
    const { relationships, customerLifecycle, contactManagement, graph, domainGraphRuntime } = await setup();
    const customer = await customerLifecycle.create(ORG, { name: 'Acme Corp' });
    const contact = await contactManagement.create(ORG, { firstName: 'Ada', lastName: 'Lovelace' });

    const customerNode = await relationships.syncCustomerToGraph(ORG, graph.id, customer);
    const contactNode = await relationships.syncContactToGraph(ORG, graph.id, contact);

    const relationship = await relationships.linkEntities(ORG, graph.id, contactNode!.nodeId, customerNode!.nodeId, 'member_of');
    expect(relationship).not.toBeNull();
    expect(relationship?.relationshipType).toBe('member_of');

    const persisted = await domainGraphRuntime.relationships.list(ORG, graph.id);
    expect(persisted).toHaveLength(1);
  });

  it('logActivityToMemory() creates a real Institutional Memory observation entry', async () => {
    const { relationships, customerLifecycle, activityTimeline, institutionalMemoryRuntime } = await setup();
    const customer = await customerLifecycle.create(ORG, { name: 'Acme Corp' });
    const activity = await activityTimeline.log(ORG, {
      activityType: 'call',
      subject: 'Kickoff call',
      notes: 'Discussed onboarding plan',
      relatedTo: { entityType: 'customer', entityId: customer.id },
    });

    const entry = await relationships.logActivityToMemory(ORG, activity);
    expect(entry).not.toBeNull();
    expect(entry?.title).toBe('Kickoff call');
    expect(entry?.content).toBe('Discussed onboarding plan');
    expect(entry?.knowledgeType).toBe('observation');
    expect(entry?.category).toBe('customer');
    expect(entry?.source).toBe('crm-engine');
    expect(entry?.tags).toEqual(['call', 'customer']);

    const persisted = await institutionalMemoryRuntime.lifecycle.get(ORG, entry!.id);
    expect(persisted).not.toBeNull();
  });

  it('logActivityToMemory() falls back to the subject when notes are absent', async () => {
    const { relationships, customerLifecycle, activityTimeline } = await setup();
    const customer = await customerLifecycle.create(ORG, { name: 'Acme Corp' });
    const activity = await activityTimeline.log(ORG, {
      activityType: 'note',
      subject: 'Renewal reminder',
      relatedTo: { entityType: 'customer', entityId: customer.id },
    });

    const entry = await relationships.logActivityToMemory(ORG, activity);
    expect(entry?.content).toBe('Renewal reminder');
  });
});
