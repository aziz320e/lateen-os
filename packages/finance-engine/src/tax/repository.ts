/** @module tax/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, TaxCalculationId, TaxRuleId } from '../shared/identifiers.js';
import type { TaxCalculation, TaxRule, TaxType } from './types.js';

export interface TaxRuleRepository extends Repository<TaxRule, TaxRuleId> {
  findAll(organizationId: OrganizationId): Promise<readonly TaxRule[]>;
  findByType(organizationId: OrganizationId, taxType: TaxType): Promise<readonly TaxRule[]>;
}

export interface TaxCalculationRepository extends Repository<TaxCalculation, TaxCalculationId> {
  findAll(organizationId: OrganizationId): Promise<readonly TaxCalculation[]>;
  findByRule(organizationId: OrganizationId, taxRuleId: TaxRuleId): Promise<readonly TaxCalculation[]>;
}
