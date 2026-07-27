import { describe, expect, it } from 'vitest';
import { createBusinessDnaRuntime } from '../src/runtime.js';

function orgInput() {
  return {
    code: 'acme',
    name: 'Acme Signage Co.',
    legalName: 'Acme Signage Company LLC',
    registrationNumber: 'REG-001',
    taxId: 'TAX-001',
    domain: 'acme.com',
    defaultCurrency: 'SAR',
    defaultLocale: 'en-SA',
    timezone: 'Asia/Riyadh',
  };
}

describe('createBusinessDnaRuntime — composition root', () => {
  it('exposes exactly organization, businessProfile, visionMission, dna, market, competitors, products, policies, queries, and events', () => {
    const runtime = createBusinessDnaRuntime();
    expect(runtime.organization).toBeDefined();
    expect(runtime.businessProfile).toBeDefined();
    expect(runtime.visionMission).toBeDefined();
    expect(runtime.dna).toBeDefined();
    expect(runtime.market).toBeDefined();
    expect(runtime.competitors).toBeDefined();
    expect(runtime.products).toBeDefined();
    expect(runtime.policies).toBeDefined();
    expect(runtime.queries).toBeDefined();
    expect(runtime.events).toBeDefined();
  });

  it('accepts an injected event bus and now() for determinism', async () => {
    const eventBus = createBusinessDnaRuntime().events;
    const fixedNow = () => '2024-01-01T00:00:00.000Z';
    const runtime = createBusinessDnaRuntime({ eventBus, now: fixedNow });
    const org = await runtime.organization.create(orgInput());
    expect(org.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(runtime.events).toBe(eventBus);
  });

  it('two independently created runtimes never share state', async () => {
    const runtimeA = createBusinessDnaRuntime();
    const runtimeB = createBusinessDnaRuntime();
    const org = await runtimeA.organization.create(orgInput());
    expect(await runtimeB.organization.get(org.id)).toBeNull();
  });
});

describe('Business DNA Runtime — end-to-end integration', () => {
  it('create -> activate -> profile -> product -> competitor -> policy flows through every real engine', async () => {
    const runtime = createBusinessDnaRuntime();
    const events: string[] = [];
    runtime.events.subscribeAll((name) => {
      events.push(name);
    });

    const org = await runtime.organization.create(orgInput());
    await runtime.organization.activate(org.id);

    await runtime.businessProfile.upsert(org.id, {
      displayName: 'Acme Signage',
      legalEntity: {
        legalName: org.legalName,
        entityType: 'llc',
        registrationNumber: org.registrationNumber,
        taxId: org.taxId,
        countryOfIncorporation: 'SA',
      },
    });

    await runtime.visionMission.setVisionMission(org.id, { vision: 'Best signage in the Gulf', mission: 'Deliver fast, quality signage' });
    await runtime.dna.setPositioning(org.id, {
      statement: 'The fastest signage partner in the Gulf',
      targetSegment: 'mid-market retail',
      differentiators: ['speed'],
    });
    await runtime.market.addOperatingMarket(org.id, { countryCode: 'SA', countryName: 'Saudi Arabia', currency: 'SAR' });

    const competitor = await runtime.competitors.add(org.id, { name: 'Riyadh Signs Co.', priceIndex: '1.15' });
    const pricePosition = runtime.competitors.compareToOwnPricing(competitor);
    expect(pricePosition).toBe('pricier');

    const product = await runtime.products.createProduct(org.id, {
      code: 'SIGN-001',
      name: 'Channel Letters',
      category: 'signage',
      productionType: 'fabrication',
      unitOfMeasure: 'sqm',
      currency: 'SAR',
      basePrice: '500.00',
      costPrice: '300.00',
    });
    await runtime.products.changeLifecycleStatus(org.id, product.id, 'active');

    const policy = await runtime.policies.create(org.id, { code: 'POL-1', name: 'Refund Policy', type: 'business' });
    await runtime.policies.activate(org.id, policy.id);

    const profileResult = await runtime.queries.findBusinessProfile({ organizationId: org.id });
    expect(profileResult.profile?.displayName).toBe('Acme Signage');

    const productsResult = await runtime.queries.findProducts({ organizationId: org.id, status: 'active' });
    expect(productsResult.total).toBe(1);

    const marketResult = await runtime.queries.findMarkets({ organizationId: org.id });
    expect(marketResult.market?.operatingMarkets).toHaveLength(1);

    expect(events).toEqual(
      expect.arrayContaining([
        'organization.created',
        'organization.activated',
        'business-profile.updated',
        'competitor.registered',
        'product.created',
        'product.updated',
        'policy.updated',
      ]),
    );
  });

  it('archiving an organization blocks further updates until restored', async () => {
    const runtime = createBusinessDnaRuntime();
    const org = await runtime.organization.create(orgInput());
    await runtime.organization.activate(org.id);
    await runtime.organization.archive(org.id);

    await expect(runtime.organization.update(org.id, { name: 'New name' })).rejects.toThrow();

    const restored = await runtime.organization.restore(org.id);
    expect(restored.status).toBe('active');
    const updated = await runtime.organization.update(org.id, { name: 'New name' });
    expect(updated.name).toBe('New name');
  });

  it('archiving a competitor removes it from rankByMarketShare()', async () => {
    const runtime = createBusinessDnaRuntime();
    const org = await runtime.organization.create(orgInput());
    const competitor = await runtime.competitors.add(org.id, { name: 'Riyadh Signs Co.', marketShareEstimatePct: '25.0' });
    expect(await runtime.competitors.rankByMarketShare(org.id)).toHaveLength(1);
    await runtime.competitors.archive(org.id, competitor.id);
    expect(await runtime.competitors.rankByMarketShare(org.id)).toHaveLength(0);
  });

  it('every module is organization-scoped end to end', async () => {
    const runtime = createBusinessDnaRuntime();
    const orgA = await runtime.organization.create(orgInput());
    const orgB = await runtime.organization.create({ ...orgInput(), code: 'other', domain: 'other.com' });

    await runtime.businessProfile.upsert(orgA.id, {
      displayName: 'A',
      legalEntity: { legalName: 'A', entityType: 'llc', registrationNumber: 'r', taxId: 't', countryOfIncorporation: 'SA' },
    });
    await runtime.competitors.add(orgA.id, { name: 'Competitor A' });

    expect(await runtime.businessProfile.get(orgB.id)).toBeNull();
    expect(await runtime.competitors.list(orgB.id)).toHaveLength(0);
  });
});
