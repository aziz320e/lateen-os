import { describe, expect, it } from 'vitest';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createAudienceRepository } from '../src/audience/repository.impl.js';
import { applyAudienceFilters, createAudienceEngine } from '../src/audience/engine.impl.js';
import { AudienceNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('applyAudienceFilters (pure)', () => {
  const candidates = [
    { id: '1', name: 'Acme Corp', email: 'info@acme.com', company: 'Acme Corp', tags: ['vip'] },
    { id: '2', name: 'Globex', email: 'contact@globex.com', company: 'Globex Inc', tags: ['prospect'] },
  ];

  it('matches on an eq filter', () => {
    const result = applyAudienceFilters(candidates, [{ field: 'name', operator: 'eq', value: 'Acme Corp' }]);
    expect(result.map((c) => c.id)).toEqual(['1']);
  });

  it('matches on a contains filter, case-insensitively', () => {
    const result = applyAudienceFilters(candidates, [{ field: 'company', operator: 'contains', value: 'globex' }]);
    expect(result.map((c) => c.id)).toEqual(['2']);
  });

  it('matches on a tag filter', () => {
    const result = applyAudienceFilters(candidates, [{ field: 'tag', operator: 'eq', value: 'vip' }]);
    expect(result.map((c) => c.id)).toEqual(['1']);
  });

  it('requires every filter to match (AND semantics)', () => {
    const result = applyAudienceFilters(candidates, [
      { field: 'tag', operator: 'eq', value: 'vip' },
      { field: 'company', operator: 'contains', value: 'globex' },
    ]);
    expect(result).toEqual([]);
  });

  it('returns every candidate when no filters are given', () => {
    expect(applyAudienceFilters(candidates, [])).toEqual(candidates);
  });
});

describe('createAudienceEngine without a CRM Engine collaborator', () => {
  function setup() {
    const repository = createAudienceRepository();
    const engine = createAudienceEngine(repository);
    return { repository, engine };
  }

  it('createAudience() creates an active audience', async () => {
    const { engine } = setup();
    const audience = await engine.createAudience(ORG, { name: 'VIP Customers', audienceType: 'static', staticMemberIds: ['customer-1'] });
    expect(audience.status).toBe('active');
  });

  it('resolveAudience() returns the fixed member list for a static audience', async () => {
    const { engine } = setup();
    const audience = await engine.createAudience(ORG, { name: 'VIP Customers', audienceType: 'static', staticMemberIds: ['customer-1', 'customer-2'] });
    expect(await engine.resolveAudience(ORG, audience.id)).toEqual(['customer-1', 'customer-2']);
  });

  it('resolveAudience() returns an empty list for a dynamic audience when CRM Engine is not injected', async () => {
    const { engine } = setup();
    const audience = await engine.createAudience(ORG, { name: 'Segment', audienceType: 'dynamic', filters: [{ field: 'tag', operator: 'eq', value: 'vip' }] });
    expect(await engine.resolveAudience(ORG, audience.id)).toEqual([]);
  });

  it('updateAudience() merges fields', async () => {
    const { engine } = setup();
    const audience = await engine.createAudience(ORG, { name: 'VIP Customers', audienceType: 'static' });
    const updated = await engine.updateAudience(ORG, audience.id, { name: 'VIP Customers 2026' });
    expect(updated.name).toBe('VIP Customers 2026');
  });

  it('archiveAudience() sets status archived', async () => {
    const { engine } = setup();
    const audience = await engine.createAudience(ORG, { name: 'VIP Customers', audienceType: 'static' });
    const archived = await engine.archiveAudience(ORG, audience.id);
    expect(archived.status).toBe('archived');
  });

  it('throws AudienceNotFoundError for an unknown audience', async () => {
    const { engine } = setup();
    await expect(engine.archiveAudience(ORG, 'missing')).rejects.toBeInstanceOf(AudienceNotFoundError);
  });

  it('getAudience() returns null for an unknown audience', async () => {
    const { engine } = setup();
    expect(await engine.getAudience(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { repository, engine } = setup();
    const audience = await engine.createAudience(ORG, { name: 'VIP Customers', audienceType: 'static' });
    expect(await repository.findById('org-2', audience.id)).toBeNull();
  });
});

describe('createAudienceEngine with a real CRM Engine runtime', () => {
  function setup() {
    const crm = createCrmRuntime();
    const repository = createAudienceRepository();
    const engine = createAudienceEngine(repository, { crm });
    return { crm, engine };
  }

  it('resolveAudience() resolves a dynamic audience against real CRM Engine customers', async () => {
    const { crm, engine } = setup();
    const vip = await crm.customers.create(ORG, { name: 'Acme Corp', tags: ['vip'] });
    await crm.customers.create(ORG, { name: 'Globex', tags: ['prospect'] });

    const audience = await engine.createAudience(ORG, {
      name: 'VIP Segment',
      audienceType: 'dynamic',
      filters: [{ field: 'tag', operator: 'eq', value: 'vip' }],
    });

    const resolved = await engine.resolveAudience(ORG, audience.id);
    expect(resolved).toEqual([vip.id]);
  });

  it('resolveAudience() returns an empty list when no customer matches', async () => {
    const { crm, engine } = setup();
    await crm.customers.create(ORG, { name: 'Globex', tags: ['prospect'] });
    const audience = await engine.createAudience(ORG, {
      name: 'VIP Segment',
      audienceType: 'dynamic',
      filters: [{ field: 'tag', operator: 'eq', value: 'vip' }],
    });
    expect(await engine.resolveAudience(ORG, audience.id)).toEqual([]);
  });

  it('is organization-scoped for dynamic resolution', async () => {
    const { crm, engine } = setup();
    await crm.customers.create(ORG, { name: 'Acme Corp', tags: ['vip'] });
    const audience = await engine.createAudience('org-2', {
      name: 'VIP Segment',
      audienceType: 'dynamic',
      filters: [{ field: 'tag', operator: 'eq', value: 'vip' }],
    });
    expect(await engine.resolveAudience('org-2', audience.id)).toEqual([]);
  });
});
