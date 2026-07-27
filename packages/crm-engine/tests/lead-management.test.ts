import { describe, expect, it, vi } from 'vitest';
import { createCustomerRepository } from '../src/customer/repository.impl.js';
import { createCustomerLifecycle } from '../src/customer/lifecycle.impl.js';
import { createLeadRepository } from '../src/lead/repository.impl.js';
import { canTransitionLead, createLeadLifecycle } from '../src/lead/lifecycle.impl.js';
import { createCrmEventBus } from '../src/events/crm-event-bus.js';
import { InvalidLeadTransitionError, LeadNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createCrmEventBus()) {
  const customerRepository = createCustomerRepository();
  const customerLifecycle = createCustomerLifecycle(customerRepository, eventBus);
  const leadRepository = createLeadRepository();
  const leadLifecycle = createLeadLifecycle(leadRepository, customerLifecycle, eventBus);
  return { customerRepository, customerLifecycle, leadRepository, leadLifecycle, eventBus };
}

describe('canTransitionLead', () => {
  it('allows new -> qualified -> converted', () => {
    expect(canTransitionLead('new', 'qualified')).toBe(true);
    expect(canTransitionLead('qualified', 'converted')).toBe(true);
  });

  it('allows new/qualified -> rejected and rejected -> new (reopen)', () => {
    expect(canTransitionLead('new', 'rejected')).toBe(true);
    expect(canTransitionLead('qualified', 'rejected')).toBe(true);
    expect(canTransitionLead('rejected', 'new')).toBe(true);
  });

  it('forbids leaving converted and skipping straight to converted from new', () => {
    expect(canTransitionLead('converted', 'new')).toBe(false);
    expect(canTransitionLead('new', 'converted')).toBe(false);
  });
});

describe('createLeadLifecycle', () => {
  it('create() creates a new lead', async () => {
    const { leadLifecycle } = setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee', email: 'jordan@example.com' });
    expect(lead.status).toBe('new');
  });

  it('qualify() moves new -> qualified', async () => {
    const { leadLifecycle } = setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee' });
    const qualified = await leadLifecycle.qualify(ORG, lead.id);
    expect(qualified.status).toBe('qualified');
  });

  it('qualify() rejects a lead that is not new', async () => {
    const { leadLifecycle } = setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee' });
    await leadLifecycle.qualify(ORG, lead.id);
    await expect(leadLifecycle.qualify(ORG, lead.id)).rejects.toBeInstanceOf(InvalidLeadTransitionError);
  });

  it('reject() sets rejectionReason and reopen() moves back to new', async () => {
    const { leadLifecycle } = setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee' });
    const rejected = await leadLifecycle.reject(ORG, lead.id, 'no budget');
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectionReason).toBe('no budget');

    const reopened = await leadLifecycle.reopen(ORG, lead.id);
    expect(reopened.status).toBe('new');
  });

  it('reject() works from qualified too', async () => {
    const { leadLifecycle } = setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee' });
    await leadLifecycle.qualify(ORG, lead.id);
    const rejected = await leadLifecycle.reject(ORG, lead.id);
    expect(rejected.status).toBe('rejected');
  });

  it('throws LeadNotFoundError for unknown lead', async () => {
    const { leadLifecycle } = setup();
    await expect(leadLifecycle.qualify(ORG, 'missing')).rejects.toBeInstanceOf(LeadNotFoundError);
  });

  it('convert() composes CustomerLifecycle.create() rather than duplicating logic', async () => {
    const { leadLifecycle, customerRepository } = setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee', email: 'jordan@example.com', company: 'Acme Corp', tags: ['hot'] });
    await leadLifecycle.qualify(ORG, lead.id);

    const result = await leadLifecycle.convert(ORG, lead.id);
    expect(result.customer.name).toBe('Jordan Lee');
    expect(result.customer.email).toBe('jordan@example.com');
    expect(result.customer.company).toBe('Acme Corp');
    expect(result.customer.tags).toEqual(['hot']);
    expect(result.customer.sourceLeadId).toBe(lead.id);

    const persisted = await customerRepository.findById(ORG, result.customer.id);
    expect(persisted).not.toBeNull();

    expect(result.lead.status).toBe('converted');
    expect(result.lead.convertedCustomerId).toBe(result.customer.id);
  });

  it('convert() rejects a non-qualified lead', async () => {
    const { leadLifecycle } = setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee' });
    await expect(leadLifecycle.convert(ORG, lead.id)).rejects.toBeInstanceOf(InvalidLeadTransitionError);
  });

  it('convert() allows overriding fields via patch', async () => {
    const { leadLifecycle } = setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee', email: 'jordan@example.com' });
    await leadLifecycle.qualify(ORG, lead.id);
    const result = await leadLifecycle.convert(ORG, lead.id, { email: 'override@example.com' });
    expect(result.customer.email).toBe('override@example.com');
  });

  it('converted lead is terminal and cannot reopen', async () => {
    const { leadLifecycle } = setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee' });
    await leadLifecycle.qualify(ORG, lead.id);
    await leadLifecycle.convert(ORG, lead.id);
    await expect(leadLifecycle.reopen(ORG, lead.id)).rejects.toBeInstanceOf(InvalidLeadTransitionError);
  });

  it('publishes lead.created, lead.qualified, and lead.converted', async () => {
    const eventBus = createCrmEventBus();
    const created = vi.fn();
    const qualified = vi.fn();
    const converted = vi.fn();
    eventBus.subscribe('lead.created', created);
    eventBus.subscribe('lead.qualified', qualified);
    eventBus.subscribe('lead.converted', converted);

    const { leadLifecycle } = setup(eventBus);
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee' });
    await leadLifecycle.qualify(ORG, lead.id);
    await leadLifecycle.convert(ORG, lead.id);
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(qualified).toHaveBeenCalledTimes(1);
    expect(converted).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { leadRepository, leadLifecycle } = setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee' });
    expect(await leadRepository.findById('org-2', lead.id)).toBeNull();
  });

  it('get() returns null for an unknown lead', async () => {
    const { leadLifecycle } = setup();
    expect(await leadLifecycle.get(ORG, 'missing')).toBeNull();
  });

  it('reopen() rejects a lead that is not rejected', async () => {
    const { leadLifecycle } = setup();
    const lead = await leadLifecycle.create(ORG, { name: 'Jordan Lee' });
    await expect(leadLifecycle.reopen(ORG, lead.id)).rejects.toBeInstanceOf(InvalidLeadTransitionError);
  });
});
