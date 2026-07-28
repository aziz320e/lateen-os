/** Typed errors used consistently across the Inventory Engine runtime implementations. @module shared/errors */

export class CategoryNotFoundError extends Error {
  constructor(readonly categoryId: string) {
    super(`Category "${categoryId}" not found`);
    this.name = 'CategoryNotFoundError';
  }
}

export class BrandNotFoundError extends Error {
  constructor(readonly brandId: string) {
    super(`Brand "${brandId}" not found`);
    this.name = 'BrandNotFoundError';
  }
}

export class InventoryItemNotFoundError extends Error {
  constructor(readonly itemId: string) {
    super(`Inventory item "${itemId}" not found`);
    this.name = 'InventoryItemNotFoundError';
  }
}

export class InvalidItemTransitionError extends Error {
  constructor(
    readonly itemId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Inventory item "${itemId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidItemTransitionError';
  }
}

export class DuplicateSkuError extends Error {
  constructor(readonly sku: string) {
    super(`SKU "${sku}" already exists in this organization`);
    this.name = 'DuplicateSkuError';
  }
}

export class WarehouseNotFoundError extends Error {
  constructor(readonly warehouseId: string) {
    super(`Warehouse "${warehouseId}" not found`);
    this.name = 'WarehouseNotFoundError';
  }
}

export class InvalidWarehouseTransitionError extends Error {
  constructor(
    readonly warehouseId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Warehouse "${warehouseId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidWarehouseTransitionError';
  }
}

export class ZoneNotFoundError extends Error {
  constructor(readonly zoneId: string) {
    super(`Zone "${zoneId}" not found`);
    this.name = 'ZoneNotFoundError';
  }
}

export class StorageLocationNotFoundError extends Error {
  constructor(readonly locationId: string) {
    super(`Storage location "${locationId}" not found`);
    this.name = 'StorageLocationNotFoundError';
  }
}

export class BinNotFoundError extends Error {
  constructor(readonly binId: string) {
    super(`Bin "${binId}" not found`);
    this.name = 'BinNotFoundError';
  }
}

export class InsufficientCapacityError extends Error {
  constructor(
    readonly targetId: string,
    readonly requested: number,
    readonly remaining: number,
  ) {
    super(`"${targetId}" has insufficient capacity: requested ${requested}, remaining ${remaining}`);
    this.name = 'InsufficientCapacityError';
  }
}

export class StockLevelNotFoundError extends Error {
  constructor(readonly stockLevelId: string) {
    super(`Stock level "${stockLevelId}" not found`);
    this.name = 'StockLevelNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor(
    readonly itemId: string,
    readonly requested: string,
    readonly available: string,
  ) {
    super(`Insufficient stock for item "${itemId}": requested ${requested}, available ${available}`);
    this.name = 'InsufficientStockError';
  }
}

export class MovementRecordNotFoundError extends Error {
  constructor(readonly movementId: string) {
    super(`Movement record "${movementId}" not found`);
    this.name = 'MovementRecordNotFoundError';
  }
}

export class ValuationRecordNotFoundError extends Error {
  constructor(readonly valuationId: string) {
    super(`Valuation record "${valuationId}" not found`);
    this.name = 'ValuationRecordNotFoundError';
  }
}

export class NoCostLayersAvailableError extends Error {
  constructor(
    readonly itemId: string,
    readonly warehouseId: string,
  ) {
    super(`No FIFO cost layers available to value an issue of item "${itemId}" at warehouse "${warehouseId}"`);
    this.name = 'NoCostLayersAvailableError';
  }
}

export class InventoryCountNotFoundError extends Error {
  constructor(readonly countId: string) {
    super(`Inventory count "${countId}" not found`);
    this.name = 'InventoryCountNotFoundError';
  }
}

export class InvalidCountTransitionError extends Error {
  constructor(
    readonly countId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Inventory count "${countId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidCountTransitionError';
  }
}

export class CountLineNotFoundError extends Error {
  constructor(
    readonly countId: string,
    readonly itemId: string,
  ) {
    super(`Inventory count "${countId}" has no line for item "${itemId}"`);
    this.name = 'CountLineNotFoundError';
  }
}

export class PurchaseRequestNotFoundError extends Error {
  constructor(readonly purchaseRequestId: string) {
    super(`Purchase request "${purchaseRequestId}" not found`);
    this.name = 'PurchaseRequestNotFoundError';
  }
}
