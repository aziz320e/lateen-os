/** @module material/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ProjectId } from '../project/types.js';
import type { MaterialRequirementId } from '../shared/identifiers.js';
import type { ProjectTaskId } from '../task/types.js';

export type { MaterialRequirementId };

export type MaterialRequirementStatus = 'planned' | 'reserved' | 'fulfilled' | 'cancelled';

/**
 * This package's own bookkeeping of required/reserved quantities for
 * a project — it never manages inventory directly. The actual stock
 * reservation is a real Inventory Engine movement, made only through
 * the Relationship Layer's `reserveProjectMaterial()`.
 */
export interface MaterialRequirement extends TenantAuditableEntity<MaterialRequirementId> {
  readonly projectId: ProjectId;
  readonly taskId?: ProjectTaskId;
  /** Opaque foreign key — an Inventory Engine `InventoryItemId`. */
  readonly itemId: string;
  /** Opaque foreign key — an Inventory Engine `WarehouseId`. */
  readonly warehouseId?: string;
  readonly requiredQuantity: string;
  readonly reservedQuantity: string;
  readonly status: MaterialRequirementStatus;
}
