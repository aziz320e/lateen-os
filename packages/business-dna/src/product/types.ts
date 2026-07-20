/** @module product/types — Enrichment v1 */
import type { Entity } from '../shared/entity.js';
import type { MachineId, OrganizationId, ProductId, SupplierId } from '../shared/identifiers.js';
import type {
  Auditable,
  BusinessCode,
  CurrencyCode,
  ISODateTime,
  TenantScoped,
} from '../shared/primitives.js';

export type ProductStatus = 'draft' | 'active' | 'seasonal' | 'discontinued' | 'archived';
export type ProductCategory =
  | 'signage'
  | 'branding'
  | 'construction_graphics'
  | 'vehicle_graphics'
  | 'retail_print'
  | 'corporate_print'
  | 'packaging'
  | 'exhibition'
  | 'architectural'
  | 'illuminated';
export type ProductionType =
  | 'print_only'
  | 'fabrication'
  | 'print_and_fabrication'
  | 'assembly'
  | 'installation_service';
export type UnitOfMeasure = 'sqm' | 'each' | 'linear_m' | 'set' | 'roll' | 'pack';
export type PrimaryMaterial =
  | 'vinyl'
  | 'acrylic'
  | 'aluminum_composite'
  | 'corrugated'
  | 'fabric'
  | 'foam_board'
  | 'steel'
  | 'pvc'
  | 'paper'
  | 'canvas';
export type FinishingStep =
  | 'lamination_matte'
  | 'lamination_gloss'
  | 'mounting'
  | 'cutting'
  | 'routing'
  | 'welding'
  | 'painting'
  | 'led_installation'
  | 'packaging';
export type ColorSpec = 'cmyk' | 'cmyk_white' | 'spot_pantone' | 'full_color' | 'monochrome';
export type MarginStatus = 'above_target' | 'on_target' | 'below_target' | 'loss';
export type TrendDirection = 'rising' | 'stable' | 'declining';
export type Seasonality =
  | 'ramadan'
  | 'hajj'
  | 'back_to_school'
  | 'national_day'
  | 'exhibition_season'
  | 'construction_peak';
export type AiDemandRisk = 'low' | 'medium' | 'high';
export type AiProductionRisk =
  | 'none'
  | 'capacity_constrained'
  | 'material_shortage'
  | 'machine_unavailable';

/** Lateen manufactured/printed product with production, profitability, trend, and AI metadata. */
export interface Product extends Entity<ProductId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly status: ProductStatus;
  readonly category: ProductCategory;
  readonly subcategory?: string;
  readonly unitOfMeasure: UnitOfMeasure;
  readonly basePrice?: string;
  readonly currency: CurrencyCode;
  readonly taxCategory?: string;
  readonly productionType: ProductionType;
  readonly primaryMaterial?: PrimaryMaterial;
  readonly materialThicknessMm?: string;
  readonly defaultWidthMm?: number;
  readonly defaultHeightMm?: number;
  readonly finishingSteps?: readonly FinishingStep[];
  readonly colorSpec?: ColorSpec;
  readonly approvedMachineIds?: readonly MachineId[];
  readonly productionLeadTimeDays?: number;
  readonly minOrderQuantity?: string;
  readonly maxOrderQuantity?: string;
  readonly requiresInstallation?: boolean;
  readonly requiresSiteSurvey?: boolean;
  readonly productionNotes?: string;
  readonly costPrice?: string;
  readonly materialCost?: string;
  readonly laborCost?: string;
  readonly machineCost?: string;
  readonly targetMarginPct?: string;
  readonly actualMarginPct?: string;
  readonly marginStatus?: MarginStatus;
  readonly lastMarginCalculatedAt?: ISODateTime;
  readonly trendScore?: string;
  readonly trendDirection?: TrendDirection;
  readonly demandForecast30d?: string;
  readonly demandForecast90d?: string;
  readonly seasonality?: readonly Seasonality[];
  readonly lastTrendUpdatedAt?: ISODateTime;
  readonly aiDemandRisk?: AiDemandRisk;
  readonly aiCrossSellProductIds?: readonly ProductId[];
  readonly aiProductionRisk?: AiProductionRisk;
  readonly aiPricingRecommendation?: string;
  readonly aiLastAnalyzedAt?: ISODateTime;
  readonly aiSummary?: string;
  readonly supplierId?: SupplierId;
}

export type { OrganizationId };
