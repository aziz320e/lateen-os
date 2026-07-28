import { describe, expect, it } from 'vitest';
import { createInventoryEventBus } from '../src/events/index.js';
import { canTransitionItem, createInventoryCatalogEngine } from '../src/item/engine.impl.js';
import { createBrandRepository, createCategoryRepository, createInventoryItemRepository } from '../src/item/repository.impl.js';
import {
  BrandNotFoundError,
  CategoryNotFoundError,
  DuplicateSkuError,
  InvalidItemTransitionError,
  InventoryItemNotFoundError,
} from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createInventoryEventBus()) {
  const itemRepository = createInventoryItemRepository();
  const categoryRepository = createCategoryRepository();
  const brandRepository = createBrandRepository();
  const engine = createInventoryCatalogEngine(itemRepository, categoryRepository, brandRepository, eventBus);
  return { itemRepository, categoryRepository, brandRepository, engine, eventBus };
}

describe('canTransitionItem (pure)', () => {
  it('allows draft -> active', () => {
    expect(canTransitionItem('draft', 'active')).toBe(true);
  });

  it('allows active -> inactive', () => {
    expect(canTransitionItem('active', 'inactive')).toBe(true);
  });

  it('allows any non-archived status -> archived', () => {
    expect(canTransitionItem('draft', 'archived')).toBe(true);
    expect(canTransitionItem('active', 'archived')).toBe(true);
    expect(canTransitionItem('inactive', 'archived')).toBe(true);
  });

  it('rejects archived -> anything — restore() is a distinct operation', () => {
    expect(canTransitionItem('archived', 'draft')).toBe(false);
    expect(canTransitionItem('archived', 'active')).toBe(false);
  });

  it('rejects draft -> inactive', () => {
    expect(canTransitionItem('draft', 'inactive')).toBe(false);
  });
});

describe('InventoryCatalogEngine — create', () => {
  it('creates a draft item at version 1', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-001', name: 'Widget', unitOfMeasure: 'EA' });
    expect(item.status).toBe('draft');
    expect(item.currentVersion).toBe(1);
  });

  it('supports barcode, serialNumber, batchNumber', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, {
      sku: 'SKU-002',
      name: 'Widget',
      unitOfMeasure: 'EA',
      barcode: '012345678905',
      serialNumber: 'SN-1',
      batchNumber: 'BATCH-1',
    });
    expect(item.barcode).toBe('012345678905');
    expect(item.serialNumber).toBe('SN-1');
    expect(item.batchNumber).toBe('BATCH-1');
  });

  it('publishes inventory.item.created', async () => {
    const eventBus = createInventoryEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('inventory.item.created', (payload) => (seen = payload));
    const item = await engine.create(ORG, { sku: 'SKU-003', name: 'Widget', unitOfMeasure: 'EA' });
    expect(seen).toEqual({ organizationId: ORG, itemId: item.id, sku: 'SKU-003' });
  });

  it('rejects a duplicate SKU within the same organization', async () => {
    const { engine } = setup();
    await engine.create(ORG, { sku: 'SKU-004', name: 'Widget', unitOfMeasure: 'EA' });
    await expect(engine.create(ORG, { sku: 'SKU-004', name: 'Other', unitOfMeasure: 'EA' })).rejects.toBeInstanceOf(DuplicateSkuError);
  });

  it('allows the same SKU across different organizations', async () => {
    const { engine } = setup();
    await engine.create(ORG, { sku: 'SKU-005', name: 'Widget', unitOfMeasure: 'EA' });
    await expect(engine.create('org-2', { sku: 'SKU-005', name: 'Widget', unitOfMeasure: 'EA' })).resolves.toBeDefined();
  });

  it('supports category and brand assignment', async () => {
    const { engine } = setup();
    const category = await engine.createCategory(ORG, { name: 'Electronics' });
    const brand = await engine.createBrand(ORG, { name: 'Acme' });
    const item = await engine.create(ORG, { sku: 'SKU-006', name: 'Widget', unitOfMeasure: 'EA', categoryId: category.id, brandId: brand.id });
    expect(item.categoryId).toBe(category.id);
    expect(item.brandId).toBe(brand.id);
  });

  it('supports an externalProductId link', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-007', name: 'Widget', unitOfMeasure: 'EA', externalProductId: 'product-1' });
    expect(item.externalProductId).toBe('product-1');
  });
});

describe('InventoryCatalogEngine — update', () => {
  it('bumps version on update', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-008', name: 'n', unitOfMeasure: 'EA' });
    const updated = await engine.update(ORG, item.id, { name: 'n2' });
    expect(updated.currentVersion).toBe(2);
    expect(updated.name).toBe('n2');
  });

  it('rejects updating an archived item', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-009', name: 'n', unitOfMeasure: 'EA' });
    await engine.archive(ORG, item.id);
    await expect(engine.update(ORG, item.id, { name: 'n2' })).rejects.toBeInstanceOf(InvalidItemTransitionError);
  });

  it('throws InventoryItemNotFoundError for an unknown item', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(InventoryItemNotFoundError);
  });
});

describe('InventoryCatalogEngine — activate/deactivate/archive/restore', () => {
  it('activate() moves draft -> active', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-010', name: 'n', unitOfMeasure: 'EA' });
    const activated = await engine.activate(ORG, item.id);
    expect(activated.status).toBe('active');
  });

  it('deactivate() moves active -> inactive', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-011', name: 'n', unitOfMeasure: 'EA' });
    await engine.activate(ORG, item.id);
    const deactivated = await engine.deactivate(ORG, item.id);
    expect(deactivated.status).toBe('inactive');
  });

  it('rejects activate() on an archived item', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-012', name: 'n', unitOfMeasure: 'EA' });
    await engine.archive(ORG, item.id);
    await expect(engine.activate(ORG, item.id)).rejects.toBeInstanceOf(InvalidItemTransitionError);
  });

  it('archive() stamps statusBeforeArchive and restore() returns to it', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-013', name: 'n', unitOfMeasure: 'EA' });
    await engine.activate(ORG, item.id);
    const archived = await engine.archive(ORG, item.id);
    expect(archived.statusBeforeArchive).toBe('active');
    const restored = await engine.restore(ORG, item.id);
    expect(restored.status).toBe('active');
  });

  it('restore() defaults to draft when archived directly from draft', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-014', name: 'n', unitOfMeasure: 'EA' });
    await engine.archive(ORG, item.id);
    const restored = await engine.restore(ORG, item.id);
    expect(restored.status).toBe('draft');
  });

  it('rejects restore() on a non-archived item', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-015', name: 'n', unitOfMeasure: 'EA' });
    await expect(engine.restore(ORG, item.id)).rejects.toBeInstanceOf(InvalidItemTransitionError);
  });
});

describe('InventoryCatalogEngine — get/list/find/org scoping', () => {
  it('get() returns null for an unknown item', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every item for the organization', async () => {
    const { engine } = setup();
    await engine.create(ORG, { sku: 'SKU-016', name: 'a', unitOfMeasure: 'EA' });
    await engine.create(ORG, { sku: 'SKU-017', name: 'b', unitOfMeasure: 'EA' });
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('findBySku()/findByBarcode() round-trip', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-018', name: 'a', unitOfMeasure: 'EA', barcode: 'BAR-018' });
    expect((await engine.findBySku(ORG, 'SKU-018'))?.id).toBe(item.id);
    expect((await engine.findByBarcode(ORG, 'BAR-018'))?.id).toBe(item.id);
  });

  it('findByCategory()/findByBrand() filter correctly', async () => {
    const { engine } = setup();
    const category = await engine.createCategory(ORG, { name: 'Electronics' });
    const brand = await engine.createBrand(ORG, { name: 'Acme' });
    await engine.create(ORG, { sku: 'SKU-019', name: 'a', unitOfMeasure: 'EA', categoryId: category.id, brandId: brand.id });
    await engine.create(ORG, { sku: 'SKU-020', name: 'b', unitOfMeasure: 'EA' });
    expect(await engine.findByCategory(ORG, category.id)).toHaveLength(1);
    expect(await engine.findByBrand(ORG, brand.id)).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, itemRepository } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-021', name: 'a', unitOfMeasure: 'EA' });
    expect(await itemRepository.findById('org-2', item.id)).toBeNull();
  });
});

describe('InventoryCatalogEngine — categories', () => {
  it('createCategory() starts active', async () => {
    const { engine } = setup();
    const category = await engine.createCategory(ORG, { name: 'Electronics' });
    expect(category.status).toBe('active');
  });

  it('supports a parentCategoryId for hierarchy', async () => {
    const { engine } = setup();
    const parent = await engine.createCategory(ORG, { name: 'Electronics' });
    const child = await engine.createCategory(ORG, { name: 'Laptops', parentCategoryId: parent.id });
    expect(child.parentCategoryId).toBe(parent.id);
  });

  it('archiveCategory()/restoreCategory() round-trip', async () => {
    const { engine } = setup();
    const category = await engine.createCategory(ORG, { name: 'Electronics' });
    const archived = await engine.archiveCategory(ORG, category.id);
    expect(archived.status).toBe('archived');
    const restored = await engine.restoreCategory(ORG, category.id);
    expect(restored.status).toBe('active');
  });

  it('throws CategoryNotFoundError for an unknown category', async () => {
    const { engine } = setup();
    await expect(engine.archiveCategory(ORG, 'missing')).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('getCategory()/listCategories() round-trip', async () => {
    const { engine } = setup();
    const category = await engine.createCategory(ORG, { name: 'Electronics' });
    expect(await engine.getCategory(ORG, category.id)).toEqual(category);
    expect(await engine.listCategories(ORG)).toHaveLength(1);
  });
});

describe('InventoryCatalogEngine — update preserves unrelated fields', () => {
  it('preserves description and unitOfMeasure when only name is updated', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-022', name: 'n', unitOfMeasure: 'KG', description: 'Original desc' });
    const updated = await engine.update(ORG, item.id, { name: 'n2' });
    expect(updated.description).toBe('Original desc');
    expect(updated.unitOfMeasure).toBe('KG');
  });

  it('updates barcode/serialNumber/batchNumber independently', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-023', name: 'n', unitOfMeasure: 'EA' });
    const updated = await engine.update(ORG, item.id, { barcode: 'BAR-1', serialNumber: 'SN-1', batchNumber: 'BATCH-1' });
    expect(updated.barcode).toBe('BAR-1');
    expect(updated.serialNumber).toBe('SN-1');
    expect(updated.batchNumber).toBe('BATCH-1');
  });
});

describe('InventoryCatalogEngine — restore reactivates a specific item without affecting siblings', () => {
  it('restoring one archived item does not affect another archived item', async () => {
    const { engine } = setup();
    const itemA = await engine.create(ORG, { sku: 'SKU-024', name: 'a', unitOfMeasure: 'EA' });
    const itemB = await engine.create(ORG, { sku: 'SKU-025', name: 'b', unitOfMeasure: 'EA' });
    await engine.archive(ORG, itemA.id);
    await engine.archive(ORG, itemB.id);
    const restoredA = await engine.restore(ORG, itemA.id);
    expect(restoredA.status).toBe('draft');
    const stillB = await engine.get(ORG, itemB.id);
    expect(stillB?.status).toBe('archived');
  });
});

describe('InventoryCatalogEngine — full lifecycle round trip', () => {
  it('supports draft -> active -> inactive -> active -> archived -> restore', async () => {
    const { engine } = setup();
    const item = await engine.create(ORG, { sku: 'SKU-026', name: 'n', unitOfMeasure: 'EA' });
    await engine.activate(ORG, item.id);
    await engine.deactivate(ORG, item.id);
    const reactivated = await engine.activate(ORG, item.id);
    expect(reactivated.status).toBe('active');
    const archived = await engine.archive(ORG, item.id);
    expect(archived.statusBeforeArchive).toBe('active');
    const restored = await engine.restore(ORG, item.id);
    expect(restored.status).toBe('active');
  });
});

describe('InventoryCatalogEngine — findByCategory/findByBrand return empty for unused lookups', () => {
  it('findByCategory() is empty for a category with no assigned items', async () => {
    const { engine } = setup();
    const category = await engine.createCategory(ORG, { name: 'Unused' });
    expect(await engine.findByCategory(ORG, category.id)).toEqual([]);
  });

  it('findByBrand() is empty for a brand with no assigned items', async () => {
    const { engine } = setup();
    const brand = await engine.createBrand(ORG, { name: 'Unused' });
    expect(await engine.findByBrand(ORG, brand.id)).toEqual([]);
  });
});

describe('InventoryCatalogEngine — nested category hierarchy', () => {
  it('supports a three-level category hierarchy', async () => {
    const { engine } = setup();
    const root = await engine.createCategory(ORG, { name: 'Electronics' });
    const mid = await engine.createCategory(ORG, { name: 'Computers', parentCategoryId: root.id });
    const leaf = await engine.createCategory(ORG, { name: 'Laptops', parentCategoryId: mid.id });
    expect(leaf.parentCategoryId).toBe(mid.id);
    expect(mid.parentCategoryId).toBe(root.id);
  });
});

describe('InventoryCatalogEngine — categories are organization-scoped', () => {
  it('a category in one organization is invisible to another', async () => {
    const { engine, categoryRepository } = setup();
    const category = await engine.createCategory(ORG, { name: 'Electronics' });
    expect(await categoryRepository.findById('org-2', category.id)).toBeNull();
  });
});

describe('InventoryCatalogEngine — brands', () => {
  it('createBrand() starts active', async () => {
    const { engine } = setup();
    const brand = await engine.createBrand(ORG, { name: 'Acme' });
    expect(brand.status).toBe('active');
  });

  it('archiveBrand()/restoreBrand() round-trip', async () => {
    const { engine } = setup();
    const brand = await engine.createBrand(ORG, { name: 'Acme' });
    const archived = await engine.archiveBrand(ORG, brand.id);
    expect(archived.status).toBe('archived');
    const restored = await engine.restoreBrand(ORG, brand.id);
    expect(restored.status).toBe('active');
  });

  it('throws BrandNotFoundError for an unknown brand', async () => {
    const { engine } = setup();
    await expect(engine.archiveBrand(ORG, 'missing')).rejects.toBeInstanceOf(BrandNotFoundError);
  });

  it('getBrand()/listBrands() round-trip', async () => {
    const { engine } = setup();
    const brand = await engine.createBrand(ORG, { name: 'Acme' });
    expect(await engine.getBrand(ORG, brand.id)).toEqual(brand);
    expect(await engine.listBrands(ORG)).toHaveLength(1);
  });
});
