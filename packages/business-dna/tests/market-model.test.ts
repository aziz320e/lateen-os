import { describe, expect, it } from 'vitest';
import { createMarketModelRepository } from '../src/market/repository.impl.js';
import { createMarketEngine } from '../src/market/engine.impl.js';
import { DuplicateOperatingMarketError, OperatingMarketNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function saudiMarket() {
  return { countryCode: 'SA', countryName: 'Saudi Arabia', region: 'GCC', languages: ['ar-SA', 'en-SA'], currency: 'SAR' };
}

function uaeMarket() {
  return { countryCode: 'AE', countryName: 'United Arab Emirates', region: 'GCC', languages: ['ar-AE', 'en-AE'], currency: 'AED' };
}

describe('createMarketEngine', () => {
  it('addOperatingMarket() creates the singleton and appends a market', async () => {
    const engine = createMarketEngine(createMarketModelRepository());
    const model = await engine.addOperatingMarket(ORG, saudiMarket());
    expect(model.id).toBe(ORG);
    expect(model.operatingMarkets).toHaveLength(1);
    expect(model.operatingMarkets[0]?.status).toBe('active');
  });

  it('addOperatingMarket() rejects a duplicate country code', async () => {
    const engine = createMarketEngine(createMarketModelRepository());
    await engine.addOperatingMarket(ORG, saudiMarket());
    await expect(engine.addOperatingMarket(ORG, saudiMarket())).rejects.toBeInstanceOf(DuplicateOperatingMarketError);
  });

  it('updateOperatingMarket() merges fields for the matching market', async () => {
    const engine = createMarketEngine(createMarketModelRepository());
    const created = await engine.addOperatingMarket(ORG, saudiMarket());
    const marketId = created.operatingMarkets[0]!.marketId;
    const updated = await engine.updateOperatingMarket(ORG, marketId, { region: 'Middle East' });
    expect(updated.operatingMarkets[0]?.region).toBe('Middle East');
  });

  it('setOperatingMarketStatus() and removeOperatingMarket() mutate the collection', async () => {
    const engine = createMarketEngine(createMarketModelRepository());
    const created = await engine.addOperatingMarket(ORG, saudiMarket());
    const marketId = created.operatingMarkets[0]!.marketId;

    const inactive = await engine.setOperatingMarketStatus(ORG, marketId, 'inactive');
    expect(inactive.operatingMarkets[0]?.status).toBe('inactive');

    const removed = await engine.removeOperatingMarket(ORG, marketId);
    expect(removed.operatingMarkets).toHaveLength(0);
  });

  it('update/status/remove throw OperatingMarketNotFoundError for an unknown market', async () => {
    const engine = createMarketEngine(createMarketModelRepository());
    await expect(engine.updateOperatingMarket(ORG, 'missing', {})).rejects.toBeInstanceOf(OperatingMarketNotFoundError);
    await expect(engine.setOperatingMarketStatus(ORG, 'missing', 'inactive')).rejects.toBeInstanceOf(OperatingMarketNotFoundError);
    await expect(engine.removeOperatingMarket(ORG, 'missing')).rejects.toBeInstanceOf(OperatingMarketNotFoundError);
  });

  it('listCountries/listRegions/listLanguages/listCurrencies are deterministic and deduplicated', async () => {
    const engine = createMarketEngine(createMarketModelRepository());
    await engine.addOperatingMarket(ORG, saudiMarket());
    await engine.addOperatingMarket(ORG, uaeMarket());

    expect(await engine.listCountries(ORG)).toEqual([
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'SA', name: 'Saudi Arabia' },
    ]);
    expect(await engine.listRegions(ORG)).toEqual(['GCC']);
    expect(await engine.listLanguages(ORG)).toEqual(['ar-AE', 'ar-SA', 'en-AE', 'en-SA']);
    expect(await engine.listCurrencies(ORG)).toEqual(['AED', 'SAR']);
  });

  it('is organization-scoped', async () => {
    const engine = createMarketEngine(createMarketModelRepository());
    await engine.addOperatingMarket(ORG, saudiMarket());
    expect(await engine.get('org-2')).toBeNull();
  });
});
