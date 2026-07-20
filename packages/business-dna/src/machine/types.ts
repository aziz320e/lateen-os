/** @module machine/types — Enrichment v1 */
import type { Entity } from '../shared/entity.js';
import type {
  BranchId,
  DepartmentId,
  EmployeeId,
  MachineId,
  OrderId,
  OrganizationId,
} from '../shared/identifiers.js';
import type {
  Auditable,
  BusinessCode,
  ISODateTime,
  TenantScoped,
} from '../shared/primitives.js';

export type MachineStatus =
  | 'draft'
  | 'active'
  | 'idle'
  | 'running'
  | 'maintenance'
  | 'error'
  | 'decommissioned'
  | 'archived';

export type MachineCategory =
  | 'print'
  | 'cut'
  | 'fabrication'
  | 'finishing'
  | 'packaging'
  | 'installation';

export type ProductionMachineType =
  | 'uv_flatbed_printer'
  | 'roll_printer_latex'
  | 'roll_printer_solvent'
  | 'dye_sublimation_printer'
  | 'screen_printer'
  | 'digital_toner_printer'
  | 'cnc_router'
  | 'flatbed_cutter'
  | 'laser_cutter'
  | 'die_cutter'
  | 'laminator'
  | 'mounting_press'
  | 'channel_letter_fabricator'
  | 'metal_fabricator'
  | 'packaging_line'
  | 'integration'
  | 'scheduled_job';

export type SupportedMaterial =
  | 'vinyl'
  | 'fabric'
  | 'acrylic'
  | 'aluminum_composite'
  | 'corrugated'
  | 'foam_board'
  | 'paper'
  | 'canvas'
  | 'pvc'
  | 'steel'
  | 'wood'
  | 'glass';

export type PrintTechnology =
  | 'uv_flatbed'
  | 'latex_roll'
  | 'solvent_roll'
  | 'dye_sublimation'
  | 'screen'
  | 'digital_toner'
  | 'none';

export type ColorCapability = 'cmyk' | 'cmyk_white' | 'cmyk_varnish' | 'spot_color' | 'monochrome';
export type ThroughputUnit = 'sqm' | 'linear_m' | 'sheets' | 'pieces';

/** Lateen print and manufacturing production machine. */
export interface Machine extends Entity<MachineId>, TenantScoped, Auditable {
  readonly branchId: BranchId;
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly status: MachineStatus;
  readonly ownerDepartmentId: DepartmentId;
  readonly ownerEmployeeId?: EmployeeId;
  readonly category: MachineCategory;
  readonly type: ProductionMachineType;
  readonly manufacturer?: string;
  readonly model?: string;
  readonly serialNumber?: string;
  readonly yearInstalled?: number;
  readonly maxWidthMm?: number;
  readonly maxLengthMm?: number;
  readonly maxThicknessMm?: string;
  readonly supportedMaterials?: readonly SupportedMaterial[];
  readonly printTechnology?: PrintTechnology;
  readonly colorCapability?: ColorCapability;
  readonly maxResolutionDpi?: number;
  readonly cutCapability?: boolean;
  readonly routingCapability?: boolean;
  readonly laminationCapability?: boolean;
  readonly embossingCapability?: boolean;
  readonly throughputUnitsPerHour?: string;
  readonly throughputUnit?: ThroughputUnit;
  readonly setupTimeMinutes?: number;
  readonly costPerHour?: string;
  readonly costPerUnit?: string;
  readonly utilizationTargetPct?: string;
  readonly currentJobId?: OrderId;
  readonly queueDepth?: number;
  readonly lastMaintenanceAt?: ISODateTime;
  readonly nextMaintenanceAt?: ISODateTime;
  readonly lastRunAt?: ISODateTime;
  readonly totalRunHours?: string;
  readonly errorCode?: string;
  readonly integrationId?: string;
}

export type { OrganizationId };
