import { describe, expect, it } from 'vitest';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import { createSalesActivityRepository } from '../src/activity/repository.impl.js';
import { createSalesActivityTimeline } from '../src/activity/timeline.impl.js';

const ORG = 'org-1';

describe('createRelationshipManagement without collaborators', () => {
  it('every method degrades to null when nothing is injected', async () => {
    const relationships = createRelationshipManagement({});
    const activity = await createSalesActivityTimeline(createSalesActivityRepository()).log(ORG, {
      activityType: 'call',
      subject: 'Kickoff',
      relatedTo: { entityType: 'opportunity', entityId: 'opp-1' },
    });

    expect(await relationships.getCustomerContext(ORG, 'customer-1')).toBeNull();
    expect(await relationships.getContactContext(ORG, 'contact-1')).toBeNull();
    expect(await relationships.getAccountContext(ORG, 'account-1')).toBeNull();
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await relationships.logActivityToMemory(ORG, activity)).toBeNull();
  });
});

describe('createRelationshipManagement with real CRM Engine, Business DNA, and Institutional Memory runtimes', () => {
  function setup() {
    const crm = createCrmRuntime();
    const businessDna = createBusinessDnaRuntime();
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const relationships = createRelationshipManagement({ crm, businessDna, institutionalMemory });
    const activityTimeline = createSalesActivityTimeline(createSalesActivityRepository());
    return { crm, businessDna, institutionalMemory, relationships, activityTimeline };
  }

  it('getCustomerContext() fetches a real CRM Engine customer', async () => {
    const { crm, relationships } = setup();
    const customer = await crm.customers.create(ORG, { name: 'Acme Corp' });
    const context = await relationships.getCustomerContext(ORG, customer.id);
    expect(context?.name).toBe('Acme Corp');
  });

  it('getCustomerContext() returns null for an unknown customer', async () => {
    const { relationships } = setup();
    expect(await relationships.getCustomerContext(ORG, 'missing')).toBeNull();
  });

  it('getContactContext() fetches a real CRM Engine contact', async () => {
    const { crm, relationships } = setup();
    const contact = await crm.contacts.create(ORG, { firstName: 'Ada', lastName: 'Lovelace' });
    const context = await relationships.getContactContext(ORG, contact.id);
    expect(context?.firstName).toBe('Ada');
  });

  it('getAccountContext() fetches a real CRM Engine account', async () => {
    const { crm, relationships } = setup();
    const account = await crm.accounts.create(ORG, { name: 'Acme Holdings' });
    const context = await relationships.getAccountContext(ORG, account.id);
    expect(context?.name).toBe('Acme Holdings');
  });

  it('getBusinessProfileContext() fetches a real Business DNA business profile', async () => {
    const { businessDna, relationships } = setup();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Manufacturing',
      legalEntity: {
        legalName: 'Acme Manufacturing LLC',
        entityType: 'llc',
        registrationNumber: 'REG-001',
        taxId: 'TAX-001',
        countryOfIncorporation: 'US',
      },
    });
    const context = await relationships.getBusinessProfileContext(ORG);
    expect(context?.displayName).toBe('Acme Manufacturing');
    expect(context?.legalEntity.legalName).toBe('Acme Manufacturing LLC');
  });

  it('getBusinessProfileContext() returns null when no profile has been set up', async () => {
    const { relationships } = setup();
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
  });

  it('logActivityToMemory() creates a real Institutional Memory observation entry', async () => {
    const { relationships, activityTimeline, institutionalMemory } = setup();
    const activity = await activityTimeline.log(ORG, {
      activityType: 'call',
      subject: 'Kickoff call',
      notes: 'Discussed onboarding plan',
      relatedTo: { entityType: 'opportunity', entityId: 'opp-1' },
    });

    const entry = await relationships.logActivityToMemory(ORG, activity);
    expect(entry).not.toBeNull();
    expect(entry?.title).toBe('Kickoff call');
    expect(entry?.content).toBe('Discussed onboarding plan');
    expect(entry?.knowledgeType).toBe('observation');
    expect(entry?.category).toBe('commercial');
    expect(entry?.source).toBe('sales-engine');
    expect(entry?.tags).toEqual(['call', 'opportunity']);

    const persisted = await institutionalMemory.lifecycle.get(ORG, entry!.id);
    expect(persisted).not.toBeNull();
  });

  it('logActivityToMemory() falls back to the subject when notes are absent', async () => {
    const { relationships, activityTimeline } = setup();
    const activity = await activityTimeline.log(ORG, {
      activityType: 'email',
      subject: 'Renewal reminder',
      relatedTo: { entityType: 'opportunity', entityId: 'opp-1' },
    });
    const entry = await relationships.logActivityToMemory(ORG, activity);
    expect(entry?.content).toBe('Renewal reminder');
  });

  it('is organization-scoped for CRM context lookups', async () => {
    const { crm, relationships } = setup();
    const customer = await crm.customers.create(ORG, { name: 'Acme Corp' });
    expect(await relationships.getCustomerContext('org-2', customer.id)).toBeNull();
  });
});
