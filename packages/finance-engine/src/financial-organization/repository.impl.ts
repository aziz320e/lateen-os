/** Real, in-memory Financial Organization repositories. @module financial-organization/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type {
  AccountingSettingsRepository,
  FiscalPeriodRepository,
  FiscalYearRepository,
  NumberingSequenceRepository,
} from './repository.js';
import type { AccountingSettings, FiscalPeriod, FiscalYear, NumberingSequence } from './types.js';

/** Creates a real, in-memory {@link FiscalYearRepository}. */
export function createFiscalYearRepository(seed?: readonly FiscalYear[]): FiscalYearRepository {
  const repo = createInMemoryRepository<FiscalYear>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link FiscalPeriodRepository}. */
export function createFiscalPeriodRepository(seed?: readonly FiscalPeriod[]): FiscalPeriodRepository {
  const repo = createInMemoryRepository<FiscalPeriod>({ seed });
  return {
    ...repo,
    async findByFiscalYearId(organizationId, fiscalYearId) {
      return repo.list(organizationId)
        .filter((period) => period.fiscalYearId === fiscalYearId)
        .sort((a, b) => a.periodNumber - b.periodNumber);
    },
  };
}

/** Creates a real, in-memory {@link AccountingSettingsRepository}. */
export function createAccountingSettingsRepository(seed?: readonly AccountingSettings[]): AccountingSettingsRepository {
  const repo = createInMemoryRepository<AccountingSettings>({ seed });
  return {
    ...repo,
    async findForOrganization(organizationId) {
      return repo.list(organizationId)[0] ?? null;
    },
  };
}

/** Creates a real, in-memory {@link NumberingSequenceRepository}. */
export function createNumberingSequenceRepository(seed?: readonly NumberingSequence[]): NumberingSequenceRepository {
  const repo = createInMemoryRepository<NumberingSequence>({ seed });
  return {
    ...repo,
    async findByType(organizationId, sequenceType) {
      return repo.list(organizationId).find((sequence) => sequence.sequenceType === sequenceType) ?? null;
    },
  };
}
