import { describe, expect, it, vi } from 'vitest';
import { createProductBundleRepository, createProductRepository } from '../src/product/repository.impl.js';
import { canTransitionProduct, createProductCatalogService } from '../src/product/catalog.impl.js';
import { createBusinessDnaEventBus } from '../src/events/business-dna-event-bus.js';
import { InvalidProductTransitionError, ProductNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function productInput() {
  return {
    code: 'SIGN-001',
    name: 'Illuminated Channel Letters',
    category: 'signage' as const,
    productionType: 'fabrication' as const,
    unitOfMeasure: 'sqm' as const,
    currency: 'SAR',
    basePrice: '500.00',
    costPrice: '300.00',
  };
}

function setup() {
  const productRepository = createProductRepository();
  const bundleRepository = createProductBundleRepository();
  const eventBus = createBusinessDnaEventBus();
  const service = createProductCatalogService(productRepository, bundleRepository, eventBus);
  return { productRepository, bundleRepository, eventBus, service };
}

describe('canTransitionProduct', () => {
  it('allows draft -> active -> seasonal -> discontinued -> archived', () => {
    expect(canTransitionProduct('draft', 'active')).toBe(true);
    expect(canTransitionProduct('active', 'seasonal')).toBe(true);
    expect(canTransitionProduct('seasonal', 'discontinued')).toBe(true);
    expect(canTransitionProduct('discontinued', 'archived')).toBe(true);
  });

  it('rejects transitions out of archived', () => {
    expect(canTransitionProduct('archived', 'active')).toBe(false);
  });
});

describe('createProductCatalogService', () => {
  it('createProduct() creates a product in draft status', async () => {
    const { service } = setup();
    const product = await service.createProduct(ORG, productInput());
    expect(product.status).toBe('draft');
    expect(product.code).toBe('SIGN-001');
  });

  it('updatePricing() computes actualMarginPct and marginStatus deterministically', async () => {
    const { service } = setup();
    const product = await service.createProduct(ORG, productInput());
    const updated = await service.updatePricing(ORG, product.id, { targetMarginPct: '40.00' });
    expect(updated.actualMarginPct).toBe('40.00');
    expect(updated.marginStatus).toBe('on_target');
  });

  it('updatePricing() flags below_target and above_target margins', async () => {
    const { service } = setup();
    const belowProduct = await service.createProduct(ORG, { ...productInput(), basePrice: '400.00', costPrice: '300.00' });
    const below = await service.updatePricing(ORG, belowProduct.id, { targetMarginPct: '40.00' });
    expect(below.marginStatus).toBe('below_target');

    const aboveProduct = await service.createProduct(ORG, { ...productInput(), basePrice: '1000.00', costPrice: '300.00' });
    const above = await service.updatePricing(ORG, aboveProduct.id, { targetMarginPct: '40.00' });
    expect(above.marginStatus).toBe('above_target');
  });

  it('updatePricing() flags a loss when cost exceeds price', async () => {
    const { service } = setup();
    const product = await service.createProduct(ORG, { ...productInput(), basePrice: '100.00', costPrice: '150.00' });
    const updated = await service.updatePricing(ORG, product.id, {});
    expect(updated.marginStatus).toBe('loss');
  });

  it('changeLifecycleStatus() is guarded', async () => {
    const { service } = setup();
    const product = await service.createProduct(ORG, productInput());
    const active = await service.changeLifecycleStatus(ORG, product.id, 'active');
    expect(active.status).toBe('active');
    await expect(service.changeLifecycleStatus(ORG, product.id, 'draft')).rejects.toBeInstanceOf(InvalidProductTransitionError);
  });

  it('updatePricing()/changeLifecycleStatus() throw ProductNotFoundError for an unknown product', async () => {
    const { service } = setup();
    await expect(service.updatePricing(ORG, 'missing', {})).rejects.toBeInstanceOf(ProductNotFoundError);
    await expect(service.changeLifecycleStatus(ORG, 'missing', 'active')).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('createBundle() computes bundlePrice as the sum of item unit prices when not provided', async () => {
    const { service } = setup();
    const productA = await service.createProduct(ORG, { ...productInput(), code: 'A', basePrice: '100.00' });
    const productB = await service.createProduct(ORG, { ...productInput(), code: 'B', basePrice: '50.00' });

    const bundle = await service.createBundle(ORG, {
      code: 'BUNDLE-1',
      name: 'Starter Kit',
      currency: 'SAR',
      items: [
        { productId: productA.id, quantity: '2' },
        { productId: productB.id, quantity: '1' },
      ],
    });
    expect(bundle.bundlePrice).toBe('250.00');
  });

  it('createBundle() respects an explicit bundlePrice override', async () => {
    const { service } = setup();
    const productA = await service.createProduct(ORG, { ...productInput(), code: 'A', basePrice: '100.00' });
    const bundle = await service.createBundle(ORG, {
      code: 'BUNDLE-2',
      name: 'Discounted Kit',
      currency: 'SAR',
      items: [{ productId: productA.id, quantity: '2' }],
      bundlePrice: '150.00',
    });
    expect(bundle.bundlePrice).toBe('150.00');
  });

  it('getBundle()/listBundles() read back created bundles, organization-scoped', async () => {
    const { service } = setup();
    const bundle = await service.createBundle(ORG, { code: 'BUNDLE-1', name: 'Kit', currency: 'SAR', items: [] });
    expect((await service.getBundle(ORG, bundle.id))?.id).toBe(bundle.id);
    expect(await service.getBundle('org-2', bundle.id)).toBeNull();
    expect(await service.listBundles(ORG)).toHaveLength(1);
  });

  it('publishes product.created on createProduct() and product.updated on every other mutation', async () => {
    const { service, eventBus } = setup();
    const created = vi.fn();
    const updated = vi.fn();
    eventBus.subscribe('product.created', created);
    eventBus.subscribe('product.updated', updated);

    const product = await service.createProduct(ORG, productInput());
    await service.updatePricing(ORG, product.id, {});
    await service.changeLifecycleStatus(ORG, product.id, 'active');
    await service.createBundle(ORG, { code: 'BUNDLE-1', name: 'Kit', currency: 'SAR', items: [] });
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenCalledTimes(3);
  });
});
