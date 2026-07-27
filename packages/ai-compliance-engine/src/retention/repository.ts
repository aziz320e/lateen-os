/** @module retention/repository */
import type { Repository } from '../shared/repository.js';
import type { ComplianceRetentionRuleId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceRetentionRule, RetentionDataCategory } from './types.js';

export interface ComplianceRetentionRuleRepository extends Repository<ComplianceRetentionRule, ComplianceRetentionRuleId> {
  findAll(organizationId: OrganizationId): Promise<readonly ComplianceRetentionRule[]>;
  findByDataCategory(organizationId: OrganizationId, dataCategory: RetentionDataCategory): Promise<ComplianceRetentionRule | null>;
}
