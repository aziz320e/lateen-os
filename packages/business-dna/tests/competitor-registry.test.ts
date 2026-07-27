import { describe, expect, it, vi } from 'vitest';
import { createCompetitorRepository } from '../src/competitor/repository.impl.js';
import { createCompetitorRegistry } from '../src/competitor/registry.impl.js';
import { createBusinessDnaEventBus } from '../src/events/business-dna-event-bus.js';
import { CompetitorNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('createCompetitorRegistry', () => {
  it('add() creates an active competitor', async () => {
    const registry = createCompetitorRegistry(createCompetitorRepository());
    const competitor = await registry.add(ORG, { name: 'Riyadh Signs Co.', strengths: ['fast delivery'], weaknesses: ['higher price'] });
    expect(competitor.status).toBe('active');
    expect(competitor.strengths).toEqual(['fast delivery']);
  });

  it('update() merges fields', async () => {
    const registry = createCompetitorRegistry(createCompetitorRepository());
    const competitor = await registry.add(ORG, { name: 'Riyadh Signs Co.' });
    const updated = await registry.update(ORG, competitor.id, { marketShareEstimatePct: '12.5' });
    expect(updated.marketShareEstimatePct).toBe('12.5');
  });

  it('archive() sets status to archived', async () => {
    const registry = createCompetitorRegistry(createCompetitorRepository());
    const competitor = await registry.add(ORG, { name: 'Riyadh Signs Co.' });
    const archived = await registry.archive(ORG, competitor.id);
    expect(archived.status).toBe('archived');
  });

  it('update()/archive() throw CompetitorNotFoundError for an unknown competitor', async () => {
    const registry = createCompetitorRegistry(createCompetitorRepository());
    await expect(registry.update(ORG, 'missing', {})).rejects.toBeInstanceOf(CompetitorNotFoundError);
    await expect(registry.archive(ORG, 'missing')).rejects.toBeInstanceOf(CompetitorNotFoundError);
  });

  it('compare() returns deterministic shared/unique strengths and weaknesses', () => {
    const registry = createCompetitorRegistry(createCompetitorRepository());
    const a = {
      id: 'a', organizationId: ORG, createdAt: '', updatedAt: '', name: 'A', status: 'active' as const,
      strengths: ['speed', 'price'], weaknesses: ['support'],
    };
    const b = {
      id: 'b', organizationId: ORG, createdAt: '', updatedAt: '', name: 'B', status: 'active' as const,
      strengths: ['price', 'quality'], weaknesses: ['support', 'coverage'],
    };
    const comparison = registry.compare(a, b);
    expect(comparison.sharedStrengths).toEqual(['price']);
    expect(comparison.strengthsOnlyInA).toEqual(['speed']);
    expect(comparison.strengthsOnlyInB).toEqual(['quality']);
    expect(comparison.sharedWeaknesses).toEqual(['support']);
    expect(comparison.weaknessesOnlyInB).toEqual(['coverage']);
  });

  it('compare() derives a relative price position when both report a priceIndex', () => {
    const registry = createCompetitorRegistry(createCompetitorRepository());
    const cheaper = {
      id: 'a', organizationId: ORG, createdAt: '', updatedAt: '', name: 'A', status: 'active' as const,
      strengths: [], weaknesses: [], priceIndex: '0.80',
    };
    const pricier = {
      id: 'b', organizationId: ORG, createdAt: '', updatedAt: '', name: 'B', status: 'active' as const,
      strengths: [], weaknesses: [], priceIndex: '1.20',
    };
    const similar = { ...pricier, id: 'c', priceIndex: '1.22' };

    expect(registry.compare(cheaper, pricier).relativePricePosition).toBe('cheaper');
    expect(registry.compare(pricier, cheaper).relativePricePosition).toBe('pricier');
    expect(registry.compare(similar, pricier).relativePricePosition).toBe('similar');
  });

  it('compare() omits price position when either competitor lacks a priceIndex', () => {
    const registry = createCompetitorRegistry(createCompetitorRepository());
    const noPrice = { id: 'a', organizationId: ORG, createdAt: '', updatedAt: '', name: 'A', status: 'active' as const, strengths: [], weaknesses: [] };
    const withPrice = { ...noPrice, id: 'b', priceIndex: '1.00' };
    expect(registry.compare(noPrice, withPrice).relativePricePosition).toBeUndefined();
  });

  it('compareToOwnPricing() defaults our price index to "1.00"', () => {
    const registry = createCompetitorRegistry(createCompetitorRepository());
    const competitor = {
      id: 'a', organizationId: ORG, createdAt: '', updatedAt: '', name: 'A', status: 'active' as const,
      strengths: [], weaknesses: [], priceIndex: '1.30',
    };
    expect(registry.compareToOwnPricing(competitor)).toBe('pricier');
    expect(registry.compareToOwnPricing(competitor, '1.30')).toBe('similar');
    expect(registry.compareToOwnPricing({ ...competitor, priceIndex: undefined })).toBeUndefined();
  });

  it('rankByMarketShare() sorts active competitors by share desc, tie-broken by name', async () => {
    const registry = createCompetitorRegistry(createCompetitorRepository());
    const alpha = await registry.add(ORG, { name: 'Alpha Signs', marketShareEstimatePct: '10.0' });
    const beta = await registry.add(ORG, { name: 'Beta Signs', marketShareEstimatePct: '20.0' });
    const gamma = await registry.add(ORG, { name: 'Gamma Signs', marketShareEstimatePct: '10.0' });
    await registry.archive(ORG, gamma.id);
    const zeta = await registry.add(ORG, { name: 'Zeta Signs', marketShareEstimatePct: '10.0' });

    const ranked = await registry.rankByMarketShare(ORG);
    expect(ranked.map((c) => c.name)).toEqual(['Beta Signs', 'Alpha Signs', 'Zeta Signs']);
    expect(ranked.map((c) => c.id)).not.toContain(gamma.id);
  });

  it('publishes competitor.registered only on add()', async () => {
    const eventBus = createBusinessDnaEventBus();
    const handler = vi.fn();
    eventBus.subscribe('competitor.registered', handler);
    const registry = createCompetitorRegistry(createCompetitorRepository(), eventBus);

    const competitor = await registry.add(ORG, { name: 'Riyadh Signs Co.' });
    await registry.update(ORG, competitor.id, { notes: 'watch closely' });
    await registry.archive(ORG, competitor.id);
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ competitorId: competitor.id, organizationId: ORG, name: 'Riyadh Signs Co.' }, expect.any(Object));
  });

  it('list() is organization-scoped', async () => {
    const registry = createCompetitorRegistry(createCompetitorRepository());
    await registry.add(ORG, { name: 'A' });
    await registry.add('org-2', { name: 'B' });
    expect(await registry.list(ORG)).toHaveLength(1);
  });
});
