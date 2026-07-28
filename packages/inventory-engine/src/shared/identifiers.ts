/**
 * Identifier types for the Inventory Engine bounded context.
 *
 * Where a sibling package already owns a canonical id (Organization,
 * Product from Business DNA; Sales Opportunity from Sales Engine), it
 * is reused directly rather than redefined.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { OrganizationId, ProductId } from '@lateen-os/business-dna';
export type { SalesOpportunityId } from '@lateen-os/sales-engine';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Inventory Catalog. */
export type InventoryItemId = Identifier;
export type CategoryId = Identifier;
export type BrandId = Identifier;

/** Warehouse Management. */
export type WarehouseId = Identifier;
export type ZoneId = Identifier;
export type StorageLocationId = Identifier;
export type BinId = Identifier;

/** Inventory Stock. */
export type StockLevelId = Identifier;

/** Inventory Movements. */
export type MovementRecordId = Identifier;

/** Stock Valuation. */
export type CostLayerId = Identifier;
export type ValuationRecordId = Identifier;

/** Inventory Counting. */
export type InventoryCountId = Identifier;

/** Procurement Preparation. */
export type PurchaseRequestId = Identifier;
