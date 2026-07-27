/** @module data-security/repository */
import type { OrganizationId, RetentionRuleId } from '../shared/identifiers.js';
import type { DataClassification, RetentionRule } from './types.js';

export interface RetentionRuleRepository {
  save(rule: RetentionRule): Promise<void>;
  findById(organizationId: OrganizationId, ruleId: RetentionRuleId): Promise<RetentionRule | null>;
  findAll(organizationId: OrganizationId): Promise<readonly RetentionRule[]>;
  findByClassification(organizationId: OrganizationId, dataClassification: DataClassification): Promise<RetentionRule | null>;
}
