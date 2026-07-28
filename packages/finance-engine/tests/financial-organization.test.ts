import { describe, expect, it } from 'vitest';
import { createFinancialOrganizationEngine } from '../src/financial-organization/engine.impl.js';
import { createStaticExchangeRateProvider } from '../src/financial-organization/exchange-rate.js';
import {
  createAccountingSettingsRepository,
  createFiscalPeriodRepository,
  createFiscalYearRepository,
  createNumberingSequenceRepository,
} from '../src/financial-organization/repository.impl.js';
import { FiscalPeriodClosedError, FiscalPeriodNotFoundError, FiscalYearNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const fiscalYearRepository = createFiscalYearRepository();
  const fiscalPeriodRepository = createFiscalPeriodRepository();
  const settingsRepository = createAccountingSettingsRepository();
  const sequenceRepository = createNumberingSequenceRepository();
  const engine = createFinancialOrganizationEngine(fiscalYearRepository, fiscalPeriodRepository, settingsRepository, sequenceRepository);
  return { fiscalYearRepository, fiscalPeriodRepository, settingsRepository, sequenceRepository, engine };
}

describe('FinancialOrganizationEngine — fiscal years', () => {
  it('creates an open fiscal year', async () => {
    const { engine } = setup();
    const fiscalYear = await engine.createFiscalYear(ORG, { name: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31' });
    expect(fiscalYear.status).toBe('open');
    expect(fiscalYear.name).toBe('FY2026');
  });

  it('closeFiscalYear() transitions to closed', async () => {
    const { engine } = setup();
    const fiscalYear = await engine.createFiscalYear(ORG, { name: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31' });
    const closed = await engine.closeFiscalYear(ORG, fiscalYear.id);
    expect(closed.status).toBe('closed');
  });

  it('closeFiscalYear() throws for an unknown fiscal year', async () => {
    const { engine } = setup();
    await expect(engine.closeFiscalYear(ORG, 'missing')).rejects.toBeInstanceOf(FiscalYearNotFoundError);
  });

  it('get()/list() round-trip and are organization-scoped', async () => {
    const { engine } = setup();
    const fiscalYear = await engine.createFiscalYear(ORG, { name: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31' });
    expect(await engine.getFiscalYear(ORG, fiscalYear.id)).toEqual(fiscalYear);
    expect(await engine.getFiscalYear('org-2', fiscalYear.id)).toBeNull();
    expect(await engine.listFiscalYears(ORG)).toHaveLength(1);
  });
});

describe('FinancialOrganizationEngine — fiscal periods', () => {
  it('generateFiscalPeriods() creates 12 consecutive monthly periods by default', async () => {
    const { engine } = setup();
    const fiscalYear = await engine.createFiscalYear(ORG, { name: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31' });
    const periods = await engine.generateFiscalPeriods(ORG, fiscalYear.id);
    expect(periods).toHaveLength(12);
    expect(periods[0]?.startDate).toBe('2026-01-01');
    expect(periods[0]?.endDate).toBe('2026-01-31');
    expect(periods[11]?.startDate).toBe('2026-12-01');
    expect(periods[11]?.endDate).toBe('2026-12-31');
    expect(periods.every((p) => p.status === 'open')).toBe(true);
  });

  it('generateFiscalPeriods() supports a custom period count', async () => {
    const { engine } = setup();
    const fiscalYear = await engine.createFiscalYear(ORG, { name: 'FY2026-Q', startDate: '2026-01-01', endDate: '2026-12-31' });
    const periods = await engine.generateFiscalPeriods(ORG, fiscalYear.id, 4);
    expect(periods).toHaveLength(4);
    expect(periods.map((p) => p.periodNumber)).toEqual([1, 2, 3, 4]);
  });

  it('generateFiscalPeriods() throws for an unknown fiscal year', async () => {
    const { engine } = setup();
    await expect(engine.generateFiscalPeriods(ORG, 'missing')).rejects.toBeInstanceOf(FiscalYearNotFoundError);
  });

  it('closeFiscalPeriod() transitions to closed and publishes period.closed', async () => {
    const { engine } = setup();
    const fiscalYear = await engine.createFiscalYear(ORG, { name: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31' });
    const [period] = await engine.generateFiscalPeriods(ORG, fiscalYear.id, 1);
    const closed = await engine.closeFiscalPeriod(ORG, period!.id);
    expect(closed.status).toBe('closed');
  });

  it('closeFiscalPeriod() throws for an unknown period', async () => {
    const { engine } = setup();
    await expect(engine.closeFiscalPeriod(ORG, 'missing')).rejects.toBeInstanceOf(FiscalPeriodNotFoundError);
  });

  it('assertFiscalPeriodOpen() throws FiscalPeriodClosedError once closed', async () => {
    const { engine } = setup();
    const fiscalYear = await engine.createFiscalYear(ORG, { name: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31' });
    const [period] = await engine.generateFiscalPeriods(ORG, fiscalYear.id, 1);
    await engine.closeFiscalPeriod(ORG, period!.id);
    await expect(engine.assertFiscalPeriodOpen(ORG, period!.id)).rejects.toBeInstanceOf(FiscalPeriodClosedError);
  });

  it('assertFiscalPeriodOpen() resolves for an open period', async () => {
    const { engine } = setup();
    const fiscalYear = await engine.createFiscalYear(ORG, { name: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31' });
    const [period] = await engine.generateFiscalPeriods(ORG, fiscalYear.id, 1);
    await expect(engine.assertFiscalPeriodOpen(ORG, period!.id)).resolves.toBeUndefined();
  });

  it('listFiscalPeriods() is sorted ascending by period number', async () => {
    const { engine } = setup();
    const fiscalYear = await engine.createFiscalYear(ORG, { name: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31' });
    await engine.generateFiscalPeriods(ORG, fiscalYear.id, 3);
    const periods = await engine.listFiscalPeriods(ORG, fiscalYear.id);
    expect(periods.map((p) => p.periodNumber)).toEqual([1, 2, 3]);
  });
});

describe('FinancialOrganizationEngine — accounting settings', () => {
  it('getAccountingSettings() returns null before configuration', async () => {
    const { engine } = setup();
    expect(await engine.getAccountingSettings(ORG)).toBeNull();
  });

  it('upsertAccountingSettings() creates settings with defaults', async () => {
    const { engine } = setup();
    const settings = await engine.upsertAccountingSettings(ORG, { baseCurrency: 'USD' });
    expect(settings.baseCurrency).toBe('USD');
    expect(settings.fiscalYearStartMonth).toBe(1);
    expect(settings.decimalPrecision).toBe(2);
  });

  it('upsertAccountingSettings() updates the same record on a second call', async () => {
    const { engine } = setup();
    const first = await engine.upsertAccountingSettings(ORG, { baseCurrency: 'USD' });
    const second = await engine.upsertAccountingSettings(ORG, { baseCurrency: 'EUR', fiscalYearStartMonth: 4 });
    expect(second.id).toBe(first.id);
    expect(second.baseCurrency).toBe('EUR');
    expect(second.fiscalYearStartMonth).toBe(4);
    expect(await engine.getAccountingSettings(ORG)).toEqual(second);
  });

  it('is organization-scoped', async () => {
    const { engine } = setup();
    await engine.upsertAccountingSettings(ORG, { baseCurrency: 'USD' });
    expect(await engine.getAccountingSettings('org-2')).toBeNull();
  });
});

describe('FinancialOrganizationEngine — numbering sequences', () => {
  it('nextSequenceNumber() auto-registers a sequence on first use', async () => {
    const { engine } = setup();
    const first = await engine.nextSequenceNumber(ORG, 'invoice');
    expect(first).toBe('00001');
  });

  it('nextSequenceNumber() increments monotonically', async () => {
    const { engine } = setup();
    const first = await engine.nextSequenceNumber(ORG, 'invoice');
    const second = await engine.nextSequenceNumber(ORG, 'invoice');
    const third = await engine.nextSequenceNumber(ORG, 'invoice');
    expect([first, second, third]).toEqual(['00001', '00002', '00003']);
  });

  it('registerNumberingSequence() honors a custom prefix and padding', async () => {
    const { engine } = setup();
    await engine.registerNumberingSequence(ORG, { sequenceType: 'invoice', prefix: 'INV-', padding: 3, startingNumber: 100 });
    const next = await engine.nextSequenceNumber(ORG, 'invoice');
    expect(next).toBe('INV-100');
  });

  it('sequences are independent per type', async () => {
    const { engine } = setup();
    const invoiceNumber = await engine.nextSequenceNumber(ORG, 'invoice');
    const billNumber = await engine.nextSequenceNumber(ORG, 'bill');
    expect(invoiceNumber).toBe('00001');
    expect(billNumber).toBe('00001');
  });
});

describe('FinancialOrganizationEngine — exchange rate conversion', () => {
  it('convertCurrency() is identity for the same currency with the default provider', async () => {
    const { engine } = setup();
    const converted = await engine.convertCurrency({ amount: '100.00', currency: 'USD' }, 'USD');
    expect(converted).toEqual({ amount: '100.00', currency: 'USD' });
  });

  it('convertCurrency() returns null when no rate is known for a differing currency', async () => {
    const { engine } = setup();
    expect(await engine.convertCurrency({ amount: '100.00', currency: 'USD' }, 'EUR')) .toBeNull();
  });

  it('convertCurrency() uses a seeded static rate for a differing currency', async () => {
    const provider = createStaticExchangeRateProvider([{ fromCurrency: 'USD', toCurrency: 'EUR', rate: '0.9', asOf: '2026-01-01T00:00:00.000Z' }]);
    const fiscalYearRepository = createFiscalYearRepository();
    const fiscalPeriodRepository = createFiscalPeriodRepository();
    const settingsRepository = createAccountingSettingsRepository();
    const sequenceRepository = createNumberingSequenceRepository();
    const engine = createFinancialOrganizationEngine(fiscalYearRepository, fiscalPeriodRepository, settingsRepository, sequenceRepository, provider);
    const converted = await engine.convertCurrency({ amount: '100.00', currency: 'USD' }, 'EUR');
    expect(converted).toEqual({ amount: '90.00', currency: 'EUR' });
  });
});

describe('ExchangeRateProvider — createStaticExchangeRateProvider', () => {
  it('getRate() returns rate "1" for same-currency', async () => {
    const provider = createStaticExchangeRateProvider();
    const rate = await provider.getRate('USD', 'USD');
    expect(rate?.rate).toBe('1');
  });

  it('getRate() picks the latest seeded rate at or before asOf', async () => {
    const provider = createStaticExchangeRateProvider([
      { fromCurrency: 'USD', toCurrency: 'EUR', rate: '0.90', asOf: '2026-01-01T00:00:00.000Z' },
      { fromCurrency: 'USD', toCurrency: 'EUR', rate: '0.95', asOf: '2026-06-01T00:00:00.000Z' },
    ]);
    const early = await provider.getRate('USD', 'EUR', '2026-03-01T00:00:00.000Z');
    const late = await provider.getRate('USD', 'EUR', '2026-12-01T00:00:00.000Z');
    expect(early?.rate).toBe('0.90');
    expect(late?.rate).toBe('0.95');
  });

  it('getRate() returns null for an unseeded pair', async () => {
    const provider = createStaticExchangeRateProvider();
    expect(await provider.getRate('USD', 'GBP')).toBeNull();
  });
});
