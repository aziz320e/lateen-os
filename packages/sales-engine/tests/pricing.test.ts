import { describe, expect, it } from 'vitest';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { computeNegotiatedPrice, computeVolumePrice, createProductPricingService } from '../src/pricing/engine.impl.js';

const ORG = 'org-1';

describe('computeNegotiatedPrice (pure)', () => {
  it('reduces the list price by the discount percentage', () => {
    expect(computeNegotiatedPrice('100.00', '10')).toBe('90.00');
  });

  it('returns the full list price for a zero discount', () => {
    expect(computeNegotiatedPrice('100.00', '0')).toBe('100.00');
  });
});

describe('computeVolumePrice (pure)', () => {
  const tiers = [
    { minQuantity: '10', discountPct: '5' },
    { minQuantity: '50', discountPct: '15' },
    { minQuantity: '100', unitPrice: '80.00' },
  ];

  it('returns the list price below the lowest tier threshold', () => {
    expect(computeVolumePrice('100.00', '5', tiers)).toBe('100.00');
  });

  it('applies the matching discount tier', () => {
    expect(computeVolumePrice('100.00', '10', tiers)).toBe('95.00');
  });

  it('applies the highest matching tier, not the first', () => {
    expect(computeVolumePrice('100.00', '75', tiers)).toBe('85.00');
  });

  it('applies a tier unit-price override outright', () => {
    expect(computeVolumePrice('100.00', '100', tiers)).toBe('80.00');
  });

  it('returns the list price when no tiers are given', () => {
    expect(computeVolumePrice('100.00', '1000', [])).toBe('100.00');
  });
});

describe('createProductPricingService without Business DNA', () => {
  it('getListPrice() and getBundlePrice() degrade to null', async () => {
    const pricing = createProductPricingService({});
    expect(await pricing.getListPrice(ORG, 'product-1')).toBeNull();
    expect(await pricing.getBundlePrice(ORG, 'bundle-1')).toBeNull();
  });

  it('computeNegotiatedPrice/computeVolumePrice remain usable offline', () => {
    const pricing = createProductPricingService({});
    expect(pricing.computeNegotiatedPrice('100.00', '10')).toBe('90.00');
    expect(pricing.computeVolumePrice('100.00', '5', [])).toBe('100.00');
  });
});

describe('createProductPricingService with a real Business DNA runtime', () => {
  async function setup() {
    const businessDna = createBusinessDnaRuntime();
    const pricing = createProductPricingService({ businessDna });
    return { businessDna, pricing };
  }

  it('getListPrice() fetches a real Business DNA product base price', async () => {
    const { businessDna, pricing } = await setup();
    const product = await businessDna.products.createProduct(ORG, {
      code: 'SGN-001',
      name: 'Illuminated Sign',
      category: 'signage',
      productionType: 'print_only',
      unitOfMeasure: 'each',
      currency: 'USD',
      basePrice: '250.00',
    });

    const listPrice = await pricing.getListPrice(ORG, product.id);
    expect(listPrice).toBe('250.00');
  });

  it('getListPrice() returns null for an unknown product', async () => {
    const { pricing } = await setup();
    expect(await pricing.getListPrice(ORG, 'missing')).toBeNull();
  });

  it('getBundlePrice() fetches a real Business DNA bundle price', async () => {
    const { businessDna, pricing } = await setup();
    const product = await businessDna.products.createProduct(ORG, {
      code: 'SGN-002',
      name: 'Vehicle Wrap',
      category: 'vehicle_graphics',
      productionType: 'print_and_fabrication',
      unitOfMeasure: 'each',
      currency: 'USD',
      basePrice: '400.00',
    });
    const bundle = await businessDna.products.createBundle(ORG, {
      code: 'BND-001',
      name: 'Fleet Package',
      items: [{ productId: product.id, quantity: '3' }],
      currency: 'USD',
    });

    const bundlePrice = await pricing.getBundlePrice(ORG, bundle.id);
    expect(bundlePrice).toBe(bundle.bundlePrice);
    expect(bundlePrice).toBe('1200.00');
  });

  it('getBundlePrice() returns null for an unknown bundle', async () => {
    const { pricing } = await setup();
    expect(await pricing.getBundlePrice(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { businessDna, pricing } = await setup();
    const product = await businessDna.products.createProduct(ORG, {
      code: 'SGN-003',
      name: 'Banner',
      category: 'signage',
      productionType: 'print_only',
      unitOfMeasure: 'each',
      currency: 'USD',
      basePrice: '50.00',
    });
    expect(await pricing.getListPrice('org-2', product.id)).toBeNull();
  });
});
