import { describe, expect, it, vi } from 'vitest';
import { createBusinessProfileRepository } from '../src/business-profile/repository.impl.js';
import { createBusinessProfileService } from '../src/business-profile/service.impl.js';
import { createBusinessDnaEventBus } from '../src/events/business-dna-event-bus.js';

const ORG = 'org-1';

function legalEntity() {
  return {
    legalName: 'Acme Signage Company LLC',
    entityType: 'llc' as const,
    registrationNumber: 'REG-001',
    taxId: 'TAX-001',
    countryOfIncorporation: 'SA',
  };
}

describe('createBusinessProfileService', () => {
  it('upsert() creates a profile keyed by organizationId', async () => {
    const service = createBusinessProfileService(createBusinessProfileRepository());
    const profile = await service.upsert(ORG, { displayName: 'Acme Signage', legalEntity: legalEntity() });
    expect(profile.id).toBe(ORG);
    expect(profile.organizationId).toBe(ORG);
    expect(profile.industries).toEqual([]);
    expect(profile.marketIds).toEqual([]);
  });

  it('upsert() merges partial fields on subsequent calls and preserves createdAt', async () => {
    const service = createBusinessProfileService(createBusinessProfileRepository());
    const first = await service.upsert(ORG, { displayName: 'Acme Signage', legalEntity: legalEntity(), website: 'https://acme.com' });
    const second = await service.upsert(ORG, { displayName: 'Acme Signage & Branding', legalEntity: legalEntity() });
    expect(second.website).toBe('https://acme.com');
    expect(second.displayName).toBe('Acme Signage & Branding');
    expect(second.createdAt).toBe(first.createdAt);
  });

  it('upsert() replaces list fields when explicitly provided', async () => {
    const service = createBusinessProfileService(createBusinessProfileRepository());
    await service.upsert(ORG, { displayName: 'Acme', legalEntity: legalEntity(), productIds: ['p1', 'p2'] });
    const updated = await service.upsert(ORG, { displayName: 'Acme', legalEntity: legalEntity(), productIds: ['p3'] });
    expect(updated.productIds).toEqual(['p3']);
  });

  it('get() returns null before any upsert', async () => {
    const service = createBusinessProfileService(createBusinessProfileRepository());
    expect(await service.get(ORG)).toBeNull();
  });

  it('is organization-scoped', async () => {
    const service = createBusinessProfileService(createBusinessProfileRepository());
    await service.upsert(ORG, { displayName: 'Acme', legalEntity: legalEntity() });
    expect(await service.get('org-2')).toBeNull();
  });

  it('publishes business-profile.updated on every upsert', async () => {
    const eventBus = createBusinessDnaEventBus();
    const handler = vi.fn();
    eventBus.subscribe('business-profile.updated', handler);
    const service = createBusinessProfileService(createBusinessProfileRepository(), eventBus);

    await service.upsert(ORG, { displayName: 'Acme', legalEntity: legalEntity() });
    await service.upsert(ORG, { displayName: 'Acme v2', legalEntity: legalEntity() });
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith({ organizationId: ORG }, expect.any(Object));
  });
});
