/** @module project/types — Enrichment v1 */
import type { Entity } from '../shared/entity.js';
import type {
  AgentId,
  BranchId,
  CustomerId,
  DepartmentId,
  EmployeeId,
  OrganizationId,
  ProductId,
  ProjectId,
  ProjectSiteId,
  RolloutPhaseId,
} from '../shared/identifiers.js';
import type {
  Address,
  Auditable,
  BusinessCode,
  CurrencyCode,
  ISODate,
  ISODateTime,
  TenantScoped,
} from '../shared/primitives.js';
import type { RegionCoverage, SlaTier } from '../shared/enums.js';

export type ProjectStatus =
  | 'draft'
  | 'planned'
  | 'design'
  | 'production'
  | 'installation'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'archived';

export type ProjectPriority = 'standard' | 'priority' | 'critical';

export type ProjectType =
  | 'signage_program'
  | 'branding_rollout'
  | 'construction_graphics'
  | 'nationwide_rollout'
  | 'exhibition_event'
  | 'vehicle_fleet'
  | 'architectural_graphics'
  | 'maintenance_program';

export type DeliveryModel =
  | 'single_site'
  | 'multi_site'
  | 'nationwide_rollout'
  | 'phased_rollout'
  | 'ongoing_program';

/** @deprecated Use RegionCoverage from shared/enums — alias kept for backward compatibility. */
export type ProjectRegion = RegionCoverage;

export type SiteInstallStatus =
  | 'pending'
  | 'surveyed'
  | 'in_production'
  | 'ready'
  | 'installed'
  | 'signed_off';

export type RolloutPhaseStatus = 'planned' | 'active' | 'completed';
export type ProjectRiskStatus = 'on_track' | 'at_risk' | 'delayed' | 'blocked';

/** Site location within a project rollout. */
export interface ProjectSite {
  readonly siteId: ProjectSiteId;
  readonly name: string;
  readonly address: Address;
  readonly region: ProjectRegion;
  readonly city: string;
  readonly installStatus: SiteInstallStatus;
  readonly assignedCrewId?: EmployeeId;
  readonly scheduledInstallAt?: ISODateTime;
}

/** Phased delivery schedule for nationwide rollouts. */
export interface RolloutPhase {
  readonly phaseId: RolloutPhaseId;
  readonly phaseNumber: number;
  readonly name: string;
  readonly regions: readonly ProjectRegion[];
  readonly siteIds: readonly ProjectSiteId[];
  readonly plannedStartDate?: ISODate;
  readonly plannedEndDate?: ISODate;
  readonly status: RolloutPhaseStatus;
}

/** Signage, branding, construction, or nationwide rollout project. */
export interface Project extends Entity<ProjectId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly status: ProjectStatus;
  readonly priority?: ProjectPriority;
  readonly customerId?: CustomerId;
  readonly contractReference?: string;
  readonly ownerId: EmployeeId;
  readonly branchId?: BranchId;
  readonly departmentId?: DepartmentId;
  readonly projectType: ProjectType;
  readonly deliveryModel: DeliveryModel;
  readonly industryContext?: string;
  readonly productIds?: readonly ProductId[];
  readonly estimatedQuantity?: string;
  readonly quantityUnit?: string;
  readonly siteCount?: number;
  readonly siteLocations?: readonly ProjectSite[];
  readonly designRequired?: boolean;
  readonly proofRequired?: boolean;
  readonly installationRequired?: boolean;
  readonly siteSurveyRequired?: boolean;
  readonly rolloutPhases?: readonly RolloutPhase[];
  readonly currentPhase?: number;
  readonly rolloutProgressPct?: string;
  readonly sitesCompleted?: number;
  readonly sitesRemaining?: number;
  readonly budget?: string;
  readonly actualCost?: string;
  readonly revenue?: string;
  readonly currency: CurrencyCode;
  readonly marginTargetPct?: string;
  readonly slaTier?: SlaTier;
  readonly slaDeliveryDate?: ISODate;
  readonly startDate?: ISODate;
  readonly designDeadline?: ISODate;
  readonly productionDeadline?: ISODate;
  readonly installDeadline?: ISODate;
  readonly endDate?: ISODate;
  readonly completedAt?: ISODateTime;
  readonly operationsAiAgentId?: AgentId;
  readonly riskStatus?: ProjectRiskStatus;
  readonly aiLastReviewAt?: ISODateTime;
  readonly aiSummary?: string;
}

export type { OrganizationId };
