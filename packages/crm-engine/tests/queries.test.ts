import { describe, expect, it } from 'vitest';
import { createCrmRuntime } from '../src/runtime.js';

const ORG = 'org-1';

async function seed() {
  const runtime = createCrmRuntime();

  const customerA = await runtime.customers.create(ORG, { name: 'Acme Corp' });
  const customerB = await runtime.customers.create(ORG, { name: 'Globex Inc' });
  await runtime.customers.archive(ORG, customerB.id);

  const leadA = await runtime.leads.create(ORG, { name: 'Jordan Lee' });
  await runtime.leads.qualify(ORG, leadA.id);

  const contactA = await runtime.contacts.create(ORG, { firstName: 'Ada', lastName: 'Lovelace', customerId: customerA.id });

  const accountA = await runtime.accounts.create(ORG, { name: 'Acme Holdings' });

  const oppA = await runtime.opportunities.create(ORG, { name: 'Acme — Annual Contract', customerId: customerA.id, accountId: accountA.id });
  await runtime.opportunities.advanceStage(ORG, oppA.id, 'qualified');
  const oppB = await runtime.opportunities.create(ORG, { name: 'Globex — Pilot' });
  await runtime.opportunities.lose(ORG, oppB.id);

  const activityA = await runtime.activities.log(ORG, { activityType: 'call', subject: 'Kickoff', relatedTo: { entityType: 'customer', entityId: customerA.id } });

  return { runtime, customerA, customerB, leadA, contactA, accountA, oppA, oppB, activityA };
}

describe('createCrmQueries via createCrmRuntime', () => {
  it('findCustomers() filters by status', async () => {
    const { runtime, customerA } = await seed();
    const active = await runtime.queries.findCustomers({ organizationId: ORG, status: 'active' });
    expect(active.customers.map((customer) => customer.id)).toEqual([customerA.id]);

    const archived = await runtime.queries.findCustomers({ organizationId: ORG, status: 'archived' });
    expect(archived.total).toBe(1);
  });

  it('findLeads() filters by status', async () => {
    const { runtime, leadA } = await seed();
    const qualified = await runtime.queries.findLeads({ organizationId: ORG, status: 'qualified' });
    expect(qualified.leads.map((lead) => lead.id)).toEqual([leadA.id]);
  });

  it('findContacts() filters by customerId', async () => {
    const { runtime, contactA, customerA } = await seed();
    const result = await runtime.queries.findContacts({ organizationId: ORG, customerId: customerA.id });
    expect(result.contacts.map((contact) => contact.id)).toEqual([contactA.id]);
  });

  it('findAccounts() returns every active account', async () => {
    const { runtime, accountA } = await seed();
    const result = await runtime.queries.findAccounts({ organizationId: ORG, status: 'active' });
    expect(result.accounts.map((account) => account.id)).toEqual([accountA.id]);
  });

  it('findDeals() groups every opportunity by stage, including empty stages', async () => {
    const { runtime, oppA, oppB } = await seed();
    const result = await runtime.queries.findDeals({ organizationId: ORG });
    expect(Object.keys(result.groupedByStage).sort()).toEqual(['lost', 'negotiation', 'new', 'proposal', 'qualified', 'won'].sort());
    expect(result.groupedByStage.qualified.map((opportunity) => opportunity.id)).toEqual([oppA.id]);
    expect(result.groupedByStage.lost.map((opportunity) => opportunity.id)).toEqual([oppB.id]);
    expect(result.groupedByStage.won).toEqual([]);
    expect(result.total).toBe(2);
  });

  it('findActivities() filters by related entity and returns most recent first', async () => {
    const { runtime, customerA, activityA } = await seed();
    await runtime.activities.log(ORG, { activityType: 'email', subject: 'Follow up', relatedTo: { entityType: 'customer', entityId: customerA.id }, occurredAt: '2099-01-01T00:00:00.000Z' });

    const result = await runtime.queries.findActivities({ organizationId: ORG, relatedEntityType: 'customer', relatedEntityId: customerA.id });
    expect(result.total).toBe(2);
    expect(result.activities[0]?.subject).toBe('Follow up');
    expect(result.activities.map((activity) => activity.id)).toContain(activityA.id);
  });

  it('findOpportunities() filters by stage and account', async () => {
    const { runtime, oppA, accountA } = await seed();
    const result = await runtime.queries.findOpportunities({ organizationId: ORG, accountId: accountA.id });
    expect(result.opportunities.map((opportunity) => opportunity.id)).toEqual([oppA.id]);
  });

  it('searchCRM() ranks an exact match above a substring match', async () => {
    const runtime = createCrmRuntime();
    await runtime.customers.create(ORG, { name: 'Acme' });
    await runtime.customers.create(ORG, { name: 'Acme Corp' });

    const result = await runtime.queries.searchCRM({ organizationId: ORG, keyword: 'Acme' });
    expect(result.matches[0]?.label).toBe('Acme');
    expect(result.matches[0]?.score).toBeGreaterThan(result.matches[1]!.score);
  });

  it('searchCRM() searches across customers, leads, contacts, accounts, and opportunities', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchCRM({ organizationId: ORG, keyword: 'Acme' });
    const recordTypes = new Set(result.matches.map((match) => match.recordType));
    expect(recordTypes.has('customer')).toBe(true);
    expect(recordTypes.has('account')).toBe(true);
    expect(recordTypes.has('opportunity')).toBe(true);
  });

  it('searchCRM() respects an explicit limit', async () => {
    const runtime = createCrmRuntime();
    await runtime.customers.create(ORG, { name: 'Acme One' });
    await runtime.customers.create(ORG, { name: 'Acme Two' });
    const result = await runtime.queries.searchCRM({ organizationId: ORG, keyword: 'Acme', limit: 1 });
    expect(result.matches).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('is organization-scoped', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findCustomers({ organizationId: 'org-2' });
    expect(result.total).toBe(0);
  });

  it('findCustomers() paginates via offset/limit while total reflects the full match set', async () => {
    const runtime = createCrmRuntime();
    await runtime.customers.create(ORG, { name: 'A' });
    await runtime.customers.create(ORG, { name: 'B' });
    await runtime.customers.create(ORG, { name: 'C' });

    const page = await runtime.queries.findCustomers({ organizationId: ORG, offset: 1, limit: 1 });
    expect(page.customers).toHaveLength(1);
    expect(page.total).toBe(3);
  });

  it('findOpportunities() filters by stage across the whole pipeline', async () => {
    const { runtime, oppB } = await seed();
    const result = await runtime.queries.findOpportunities({ organizationId: ORG, stage: 'lost' });
    expect(result.opportunities.map((opportunity) => opportunity.id)).toEqual([oppB.id]);
  });

  it('findContacts() filters by accountId', async () => {
    const { runtime, accountA } = await seed();
    await runtime.contacts.create(ORG, { firstName: 'Grace', lastName: 'Hopper', accountId: accountA.id });
    const result = await runtime.queries.findContacts({ organizationId: ORG, accountId: accountA.id });
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0]?.firstName).toBe('Grace');
  });

  it('findActivities() filters by activityType', async () => {
    const { runtime, customerA } = await seed();
    await runtime.activities.log(ORG, { activityType: 'task', subject: 'Send proposal', relatedTo: { entityType: 'customer', entityId: customerA.id } });
    const result = await runtime.queries.findActivities({ organizationId: ORG, activityType: 'task' });
    expect(result.total).toBe(1);
    expect(result.activities[0]?.subject).toBe('Send proposal');
  });

  it('searchCRM() returns no matches for an unrelated keyword', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchCRM({ organizationId: ORG, keyword: 'Nonexistent' });
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });
});
