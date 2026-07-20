/** @module machine-discovery/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  CapabilityId,
  MachineId,
  MachineOpportunityId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { MachineOpportunityId };

export type MachineOpportunityStatus = 'identified' | 'evaluating' | 'recommended' | 'rejected' | 'archived';

/** Return on investment as decimal string (percentage or ratio per convention). */
export type ROI = string;

/** Payback period in months as decimal string. */
export type PaybackPeriod = string;

export interface MachineRecommendation {
  readonly machineId?: MachineId;
  readonly proposedModel?: string;
  readonly capabilityIds: readonly CapabilityId[];
  readonly roi: ROI;
  readonly paybackPeriod: PaybackPeriod;
  readonly rationale?: string;
}

/** Intelligence-identified machine investment or upgrade opportunity. */
export interface MachineOpportunity extends TenantAuditableEntity<MachineOpportunityId> {
  readonly title: string;
  readonly description?: string;
  readonly recommendation: MachineRecommendation;
  readonly status: MachineOpportunityStatus;
}

export type { OrganizationId };
