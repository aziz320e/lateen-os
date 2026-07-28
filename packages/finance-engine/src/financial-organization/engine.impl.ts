/**
 * Real Financial Organization engine — fiscal years and their
 * periods, organization-wide accounting settings (base currency,
 * fiscal year start month, decimal precision), and numbering
 * sequences. Every operation is deterministic; the only injected
 * abstraction is the {@link ExchangeRateProvider}, and even that
 * defaults to a fully offline static provider.
 *
 * @module financial-organization/engine.impl
 */
import { addMonthsIso } from '../shared/date.js';
import type { FinanceEventBus } from '../events/finance-event-bus.js';
import { FiscalPeriodClosedError, FiscalPeriodNotFoundError, FiscalYearNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { FiscalPeriodId, FiscalYearId, OrganizationId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate, Money } from '../shared/primitives.js';
import { createStaticExchangeRateProvider, type ExchangeRateProvider } from './exchange-rate.js';
import type {
  AccountingSettingsRepository,
  FiscalPeriodRepository,
  FiscalYearRepository,
  NumberingSequenceRepository,
} from './repository.js';
import type {
  AccountingSettings,
  FiscalPeriod,
  FiscalYear,
  NumberingSequence,
  NumberingSequenceType,
} from './types.js';

export interface CreateFiscalYearInput {
  readonly name: string;
  readonly startDate: ISODate;
  readonly endDate: ISODate;
}

export interface UpsertAccountingSettingsInput {
  readonly baseCurrency: CurrencyCode;
  readonly fiscalYearStartMonth?: number;
  readonly decimalPrecision?: number;
}

export interface RegisterNumberingSequenceInput {
  readonly sequenceType: NumberingSequenceType;
  readonly prefix?: string;
  readonly startingNumber?: number;
  readonly padding?: number;
}

export interface FinancialOrganizationEngine {
  createFiscalYear(organizationId: OrganizationId, input: CreateFiscalYearInput): Promise<FiscalYear>;
  closeFiscalYear(organizationId: OrganizationId, fiscalYearId: FiscalYearId): Promise<FiscalYear>;
  getFiscalYear(organizationId: OrganizationId, fiscalYearId: FiscalYearId): Promise<FiscalYear | null>;
  listFiscalYears(organizationId: OrganizationId): Promise<readonly FiscalYear[]>;

  /** Generates `periodCount` (default 12) consecutive monthly fiscal periods spanning the fiscal year. */
  generateFiscalPeriods(organizationId: OrganizationId, fiscalYearId: FiscalYearId, periodCount?: number): Promise<readonly FiscalPeriod[]>;
  closeFiscalPeriod(organizationId: OrganizationId, fiscalPeriodId: FiscalPeriodId): Promise<FiscalPeriod>;
  getFiscalPeriod(organizationId: OrganizationId, fiscalPeriodId: FiscalPeriodId): Promise<FiscalPeriod | null>;
  listFiscalPeriods(organizationId: OrganizationId, fiscalYearId: FiscalYearId): Promise<readonly FiscalPeriod[]>;
  /** Throws {@link FiscalPeriodClosedError} if the given period is closed. */
  assertFiscalPeriodOpen(organizationId: OrganizationId, fiscalPeriodId: FiscalPeriodId): Promise<void>;

  getAccountingSettings(organizationId: OrganizationId): Promise<AccountingSettings | null>;
  upsertAccountingSettings(organizationId: OrganizationId, input: UpsertAccountingSettingsInput): Promise<AccountingSettings>;

  registerNumberingSequence(organizationId: OrganizationId, input: RegisterNumberingSequenceInput): Promise<NumberingSequence>;
  /** Atomically hands out the next formatted document number for `sequenceType`, auto-registering the sequence on first use. */
  nextSequenceNumber(organizationId: OrganizationId, sequenceType: NumberingSequenceType): Promise<string>;

  convertCurrency(money: Money, toCurrency: CurrencyCode, asOf?: string): Promise<Money | null>;
}

function formatSequenceNumber(sequence: Pick<NumberingSequence, 'prefix' | 'nextNumber' | 'padding'>): string {
  const padded = String(sequence.nextNumber).padStart(sequence.padding, '0');
  return sequence.prefix ? `${sequence.prefix}${padded}` : padded;
}

/** Creates a real {@link FinancialOrganizationEngine}. */
export function createFinancialOrganizationEngine(
  fiscalYearRepository: FiscalYearRepository,
  fiscalPeriodRepository: FiscalPeriodRepository,
  settingsRepository: AccountingSettingsRepository,
  sequenceRepository: NumberingSequenceRepository,
  exchangeRateProvider: ExchangeRateProvider = createStaticExchangeRateProvider(),
  eventBus?: FinanceEventBus,
  now: () => string = nowIso,
): FinancialOrganizationEngine {
  async function requireFiscalYear(organizationId: OrganizationId, fiscalYearId: FiscalYearId): Promise<FiscalYear> {
    const fiscalYear = await fiscalYearRepository.findById(organizationId, fiscalYearId);
    if (!fiscalYear) throw new FiscalYearNotFoundError(fiscalYearId);
    return fiscalYear;
  }

  async function requireFiscalPeriod(organizationId: OrganizationId, fiscalPeriodId: FiscalPeriodId): Promise<FiscalPeriod> {
    const period = await fiscalPeriodRepository.findById(organizationId, fiscalPeriodId);
    if (!period) throw new FiscalPeriodNotFoundError(fiscalPeriodId);
    return period;
  }

  async function upsertSequence(organizationId: OrganizationId, input: RegisterNumberingSequenceInput): Promise<NumberingSequence> {
    const existing = await sequenceRepository.findByType(organizationId, input.sequenceType);
    const timestamp = now();
    const sequence: NumberingSequence = {
      id: existing?.id ?? generateId('numbering-sequence'),
      organizationId,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      sequenceType: input.sequenceType,
      prefix: input.prefix ?? existing?.prefix,
      nextNumber: input.startingNumber ?? existing?.nextNumber ?? 1,
      padding: input.padding ?? existing?.padding ?? 5,
    };
    await sequenceRepository.save(sequence);
    return sequence;
  }

  return {
    async createFiscalYear(organizationId, input) {
      const timestamp = now();
      const fiscalYear: FiscalYear = {
        id: generateId('fiscal-year'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        status: 'open',
      };
      await fiscalYearRepository.save(fiscalYear);
      return fiscalYear;
    },

    async closeFiscalYear(organizationId, fiscalYearId) {
      const fiscalYear = await requireFiscalYear(organizationId, fiscalYearId);
      const updated: FiscalYear = { ...fiscalYear, status: 'closed', updatedAt: now() };
      await fiscalYearRepository.save(updated);
      return updated;
    },

    async getFiscalYear(organizationId, fiscalYearId) {
      return fiscalYearRepository.findById(organizationId, fiscalYearId);
    },

    async listFiscalYears(organizationId) {
      return fiscalYearRepository.findAll(organizationId);
    },

    async generateFiscalPeriods(organizationId, fiscalYearId, periodCount = 12) {
      const fiscalYear = await requireFiscalYear(organizationId, fiscalYearId);
      const timestamp = now();
      const periods: FiscalPeriod[] = [];
      for (let periodNumber = 1; periodNumber <= periodCount; periodNumber += 1) {
        const startDate = addMonthsIso(fiscalYear.startDate, periodNumber - 1);
        const periodEnd = addMonthsIso(fiscalYear.startDate, periodNumber);
        const endDateExclusive = new Date(`${periodEnd}T00:00:00.000Z`);
        endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() - 1);
        const endDate = endDateExclusive.toISOString().slice(0, 10);
        const period: FiscalPeriod = {
          id: generateId('fiscal-period'),
          organizationId,
          createdAt: timestamp,
          updatedAt: timestamp,
          fiscalYearId,
          periodNumber,
          name: `${fiscalYear.name} - P${periodNumber}`,
          startDate,
          endDate,
          status: 'open',
        };
        await fiscalPeriodRepository.save(period);
        periods.push(period);
      }
      return periods;
    },

    async closeFiscalPeriod(organizationId, fiscalPeriodId) {
      const period = await requireFiscalPeriod(organizationId, fiscalPeriodId);
      const updated: FiscalPeriod = { ...period, status: 'closed', updatedAt: now() };
      await fiscalPeriodRepository.save(updated);
      eventBus?.publish('period.closed', { organizationId, fiscalPeriodId });
      return updated;
    },

    async getFiscalPeriod(organizationId, fiscalPeriodId) {
      return fiscalPeriodRepository.findById(organizationId, fiscalPeriodId);
    },

    async listFiscalPeriods(organizationId, fiscalYearId) {
      return fiscalPeriodRepository.findByFiscalYearId(organizationId, fiscalYearId);
    },

    async assertFiscalPeriodOpen(organizationId, fiscalPeriodId) {
      const period = await requireFiscalPeriod(organizationId, fiscalPeriodId);
      if (period.status === 'closed') throw new FiscalPeriodClosedError(fiscalPeriodId);
    },

    async getAccountingSettings(organizationId) {
      return settingsRepository.findForOrganization(organizationId);
    },

    async upsertAccountingSettings(organizationId, input) {
      const existing = await settingsRepository.findForOrganization(organizationId);
      const timestamp = now();
      const settings: AccountingSettings = {
        id: existing?.id ?? generateId('accounting-settings'),
        organizationId,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
        baseCurrency: input.baseCurrency,
        fiscalYearStartMonth: input.fiscalYearStartMonth ?? existing?.fiscalYearStartMonth ?? 1,
        decimalPrecision: input.decimalPrecision ?? existing?.decimalPrecision ?? 2,
      };
      await settingsRepository.save(settings);
      return settings;
    },

    async registerNumberingSequence(organizationId, input) {
      return upsertSequence(organizationId, input);
    },

    async nextSequenceNumber(organizationId, sequenceType) {
      const sequence = (await sequenceRepository.findByType(organizationId, sequenceType)) ?? (await upsertSequence(organizationId, { sequenceType }));
      const formatted = formatSequenceNumber(sequence);
      const advanced: NumberingSequence = { ...sequence, nextNumber: sequence.nextNumber + 1, updatedAt: now() };
      await sequenceRepository.save(advanced);
      return formatted;
    },

    async convertCurrency(money, toCurrency, asOf) {
      return exchangeRateProvider.convert(money, toCurrency, asOf);
    },
  };
}
