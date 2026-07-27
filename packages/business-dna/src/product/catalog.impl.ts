/**
 * Real Product Catalog — product creation, deterministic pricing/margin
 * calculation, guarded lifecycle transitions, and priced bundles.
 *
 * @module product/catalog.impl
 */
import type { BusinessDnaEventBus } from '../events/business-dna-event-bus.js';
import { InvalidProductTransitionError, ProductNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, ProductBundleId, ProductId } from '../shared/identifiers.js';
import type { BusinessCode, CurrencyCode } from '../shared/primitives.js';
import type { ProductBundleRepository, ProductRepository } from './repository.js';
import type {
  MarginStatus,
  Product,
  ProductBundle,
  ProductBundleItem,
  ProductCategory,
  ProductStatus,
  ProductionType,
} from './types.js';

const PRODUCT_TRANSITIONS: Readonly<Record<ProductStatus, readonly ProductStatus[]>> = {
  draft: ['active', 'archived'],
  active: ['seasonal', 'discontinued', 'archived'],
  seasonal: ['active', 'discontinued', 'archived'],
  discontinued: ['archived'],
  archived: [],
};

export function canTransitionProduct(from: ProductStatus, to: ProductStatus): boolean {
  return PRODUCT_TRANSITIONS[from].includes(to);
}

function computeMarginStatus(actualPct: number, targetPct?: number): MarginStatus | undefined {
  if (actualPct < 0) return 'loss';
  if (targetPct === undefined) return undefined;
  if (actualPct > targetPct + 2) return 'above_target';
  if (actualPct < targetPct - 2) return 'below_target';
  return 'on_target';
}

export interface CreateProductInput {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly category: ProductCategory;
  readonly productionType: ProductionType;
  readonly unitOfMeasure: Product['unitOfMeasure'];
  readonly currency: CurrencyCode;
  readonly basePrice?: string;
  readonly costPrice?: string;
}

export interface UpdatePricingInput {
  readonly basePrice?: string;
  readonly costPrice?: string;
  readonly materialCost?: string;
  readonly laborCost?: string;
  readonly machineCost?: string;
  readonly targetMarginPct?: string;
}

export interface CreateBundleInput {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly items: readonly ProductBundleItem[];
  readonly currency: CurrencyCode;
  readonly bundlePrice?: string;
}

export interface ProductCatalogService {
  createProduct(organizationId: OrganizationId, input: CreateProductInput): Promise<Product>;
  updatePricing(organizationId: OrganizationId, productId: ProductId, input: UpdatePricingInput): Promise<Product>;
  changeLifecycleStatus(organizationId: OrganizationId, productId: ProductId, status: ProductStatus): Promise<Product>;
  getProduct(organizationId: OrganizationId, productId: ProductId): Promise<Product | null>;
  createBundle(organizationId: OrganizationId, input: CreateBundleInput): Promise<ProductBundle>;
  getBundle(organizationId: OrganizationId, bundleId: ProductBundleId): Promise<ProductBundle | null>;
  listBundles(organizationId: OrganizationId): Promise<readonly ProductBundle[]>;
}

/** Creates a real {@link ProductCatalogService} over {@link ProductRepository} and {@link ProductBundleRepository}. */
export function createProductCatalogService(
  productRepository: ProductRepository,
  bundleRepository: ProductBundleRepository,
  eventBus?: BusinessDnaEventBus,
  now: () => string = nowIso,
): ProductCatalogService {
  async function requireProduct(organizationId: OrganizationId, productId: ProductId): Promise<Product> {
    const product = await productRepository.findById(organizationId, productId);
    if (!product) throw new ProductNotFoundError(productId);
    return product;
  }

  return {
    async createProduct(organizationId, input) {
      const timestamp = now();
      const product: Product = {
        id: generateId('product'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        name: input.name,
        description: input.description,
        status: 'draft',
        category: input.category,
        unitOfMeasure: input.unitOfMeasure,
        basePrice: input.basePrice,
        currency: input.currency,
        productionType: input.productionType,
        costPrice: input.costPrice,
      };
      await productRepository.save(product);
      eventBus?.publish('product.created', { productId: product.id, organizationId, code: product.code });
      return product;
    },

    async updatePricing(organizationId, productId, input) {
      const product = await requireProduct(organizationId, productId);
      const basePrice = input.basePrice ?? product.basePrice;
      const costPrice = input.costPrice ?? product.costPrice;
      const targetMarginPct = input.targetMarginPct ?? product.targetMarginPct;

      let actualMarginPct = product.actualMarginPct;
      let marginStatus = product.marginStatus;
      if (basePrice && costPrice) {
        const base = Number.parseFloat(basePrice);
        const cost = Number.parseFloat(costPrice);
        const computed = base > 0 ? ((base - cost) / base) * 100 : 0;
        actualMarginPct = computed.toFixed(2);
        marginStatus = computeMarginStatus(computed, targetMarginPct ? Number.parseFloat(targetMarginPct) : undefined);
      }

      const updated: Product = {
        ...product,
        basePrice,
        costPrice,
        materialCost: input.materialCost ?? product.materialCost,
        laborCost: input.laborCost ?? product.laborCost,
        machineCost: input.machineCost ?? product.machineCost,
        targetMarginPct,
        actualMarginPct,
        marginStatus,
        lastMarginCalculatedAt: actualMarginPct !== product.actualMarginPct ? now() : product.lastMarginCalculatedAt,
        updatedAt: now(),
      };
      await productRepository.save(updated);
      eventBus?.publish('product.updated', { productId, organizationId });
      return updated;
    },

    async changeLifecycleStatus(organizationId, productId, status) {
      const product = await requireProduct(organizationId, productId);
      if (!canTransitionProduct(product.status, status)) {
        throw new InvalidProductTransitionError(productId, product.status, status);
      }
      const updated: Product = { ...product, status, updatedAt: now() };
      await productRepository.save(updated);
      eventBus?.publish('product.updated', { productId, organizationId });
      return updated;
    },

    async getProduct(organizationId, productId) {
      return productRepository.findById(organizationId, productId);
    },

    async createBundle(organizationId, input) {
      let bundlePrice = input.bundlePrice;
      if (!bundlePrice) {
        let total = 0;
        for (const item of input.items) {
          const product = await productRepository.findById(organizationId, item.productId);
          const unitPrice = product?.basePrice ? Number.parseFloat(product.basePrice) : 0;
          total += unitPrice * Number.parseFloat(item.quantity);
        }
        bundlePrice = total.toFixed(2);
      }

      const timestamp = now();
      const bundle: ProductBundle = {
        id: generateId('bundle'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        name: input.name,
        description: input.description,
        items: input.items,
        bundlePrice,
        currency: input.currency,
        status: 'draft',
      };
      await bundleRepository.save(bundle);
      eventBus?.publish('product.updated', { productId: bundle.id, organizationId });
      return bundle;
    },

    async getBundle(organizationId, bundleId) {
      return bundleRepository.findById(organizationId, bundleId);
    },

    async listBundles(organizationId) {
      return bundleRepository.findAll(organizationId);
    },
  };
}
