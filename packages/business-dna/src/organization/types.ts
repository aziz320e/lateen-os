/**
 * Organization aggregate types.
 * Root entity of Business DNA — Lateen AI-first printing and manufacturing org.
 *
 * @module organization/types
 */

import type { Entity } from '../shared/entity.js';
import type { OrganizationId, PolicyId, EmployeeId } from '../shared/identifiers.js';
import type {
  Auditable,
  BusinessCode,
  CurrencyCode,
  ISODate,
  LocaleCode,
  Timezone,
} from '../shared/primitives.js';

export type OrganizationStatus = 'draft' | 'active' | 'suspended' | 'archived';

export type OperatingModel = 'ai_first';

export type AiDecisionThreshold = 'informational' | 'recommendation' | 'approval_required';

export type IndustryVertical =
  | 'signage'
  | 'branding'
  | 'construction_graphics'
  | 'packaging'
  | 'retail_print'
  | 'corporate_print'
  | 'vehicle_wrapping'
  | 'exhibition';

export type ProductionModel = 'make_to_order' | 'make_to_stock' | 'hybrid';

export type ServiceCoverage = 'local' | 'regional' | 'nationwide';

import type { SlaTier } from '../shared/enums.js';
export type { SlaTier };

/** Organization aggregate root (Business DNA Layer 1). */
export interface Organization extends Entity<OrganizationId>, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly legalName: string;
  readonly registrationNumber: string;
  readonly taxId: string;
  readonly status: OrganizationStatus;
  readonly defaultCurrency: CurrencyCode;
  readonly defaultLocale: LocaleCode;
  readonly timezone: Timezone;
  readonly foundedAt?: ISODate;
  readonly operatingModel: OperatingModel;
  readonly proactiveAiEnabled: boolean;
  readonly aiCouncilPolicyId?: PolicyId;
  readonly defaultAiSupervisorId?: EmployeeId;
  readonly aiDecisionThreshold?: AiDecisionThreshold;
  readonly registeredAgentCount?: number;
  readonly industryVerticals: readonly IndustryVertical[];
  readonly productionModel: ProductionModel;
  readonly serviceCoverage: ServiceCoverage;
  readonly defaultPaymentTerms?: string;
  readonly defaultSlaTier?: SlaTier;
}
