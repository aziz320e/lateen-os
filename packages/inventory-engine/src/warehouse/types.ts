/** @module warehouse/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { BinId, StorageLocationId, WarehouseId, ZoneId } from '../shared/identifiers.js';

export type { BinId, StorageLocationId, WarehouseId, ZoneId };

export type WarehouseStatus = 'active' | 'archived';

/** A physical warehouse facility. */
export interface Warehouse extends TenantAuditableEntity<WarehouseId> {
  readonly code: string;
  readonly name: string;
  readonly address?: string;
  readonly status: WarehouseStatus;
}

export type ZoneStatus = 'active' | 'archived';

/** A functional area within a warehouse (e.g. receiving, bulk storage, cold storage). */
export interface Zone extends TenantAuditableEntity<ZoneId> {
  readonly warehouseId: WarehouseId;
  readonly code: string;
  readonly name: string;
  readonly status: ZoneStatus;
}

export type StorageLocationStatus = 'active' | 'archived';

/** An addressable storage location (e.g. an aisle or rack) within a warehouse, optionally within a zone. */
export interface StorageLocation extends TenantAuditableEntity<StorageLocationId> {
  readonly warehouseId: WarehouseId;
  readonly zoneId?: ZoneId;
  readonly code: string;
  readonly name: string;
  readonly capacity?: number;
  readonly status: StorageLocationStatus;
}

export type BinStatus = 'active' | 'archived';

/** The smallest addressable storage unit, within a storage location. */
export interface Bin extends TenantAuditableEntity<BinId> {
  readonly locationId: StorageLocationId;
  readonly code: string;
  readonly capacity?: number;
  readonly status: BinStatus;
}
