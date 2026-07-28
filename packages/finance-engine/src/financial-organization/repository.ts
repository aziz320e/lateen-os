/** @module financial-organization/repository */
import type { Repository } from '../shared/repository.js';
import type { AccountingSettingsId, FiscalPeriodId, FiscalYearId, NumberingSequenceId, OrganizationId } from '../shared/identifiers.js';
import type { AccountingSettings, FiscalPeriod, FiscalYear, NumberingSequence, NumberingSequenceType } from './types.js';

export interface FiscalYearRepository extends Repository<FiscalYear, FiscalYearId> {
  findAll(organizationId: OrganizationId): Promise<readonly FiscalYear[]>;
}

export interface FiscalPeriodRepository extends Repository<FiscalPeriod, FiscalPeriodId> {
  findByFiscalYearId(organizationId: OrganizationId, fiscalYearId: FiscalYearId): Promise<readonly FiscalPeriod[]>;
}

export interface AccountingSettingsRepository extends Repository<AccountingSettings, AccountingSettingsId> {
  /** The single accounting settings record for the organization, if configured. */
  findForOrganization(organizationId: OrganizationId): Promise<AccountingSettings | null>;
}

export interface NumberingSequenceRepository extends Repository<NumberingSequence, NumberingSequenceId> {
  findByType(organizationId: OrganizationId, sequenceType: NumberingSequenceType): Promise<NumberingSequence | null>;
}
