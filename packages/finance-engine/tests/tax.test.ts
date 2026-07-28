import { describe, expect, it } from 'vitest';
import { calculateTax, createTaxEngine } from '../src/tax/engine.impl.js';
import { createTaxCalculationRepository, createTaxRuleRepository } from '../src/tax/repository.impl.js';
import { createFinanceEventBus } from '../src/events/index.js';
import { InvalidTaxRuleError, TaxRuleNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createFinanceEventBus()) {
  const ruleRepository = createTaxRuleRepository();
  const calculationRepository = createTaxCalculationRepository();
  const engine = createTaxEngine(ruleRepository, calculationRepository, eventBus);
  return { ruleRepository, calculationRepository, engine, eventBus };
}

describe('calculateTax (pure)', () => {
  it('computes rate percentage of a taxable amount', () => {
    expect(calculateTax('200.00', '15')).toBe('30.00');
  });

  it('is 0 for a 0 rate', () => {
    expect(calculateTax('200.00', '0')).toBe('0.00');
  });
});

describe('TaxEngine — createTaxRule', () => {
  it('creates an active VAT rule', async () => {
    const { engine } = setup();
    const rule = await engine.createTaxRule(ORG, { name: 'Standard VAT', taxType: 'VAT', ratePct: '15' });
    expect(rule.active).toBe(true);
    expect(rule.taxType).toBe('VAT');
  });

  it('supports all five tax types', async () => {
    const { engine } = setup();
    const nonZero = ['VAT', 'GST', 'SALES_TAX'] as const;
    for (const taxType of nonZero) {
      const rule = await engine.createTaxRule(ORG, { name: taxType, taxType, ratePct: '10' });
      expect(rule.taxType).toBe(taxType);
    }
    const zeroRated = await engine.createTaxRule(ORG, { name: 'Zero Rated', taxType: 'ZERO_RATED', ratePct: '0' });
    const exempt = await engine.createTaxRule(ORG, { name: 'Exempt', taxType: 'EXEMPT', ratePct: '0' });
    expect(zeroRated.ratePct).toBe('0');
    expect(exempt.ratePct).toBe('0');
  });

  it('rejects a non-zero rate for ZERO_RATED', async () => {
    const { engine } = setup();
    await expect(engine.createTaxRule(ORG, { name: 'Bad', taxType: 'ZERO_RATED', ratePct: '5' })).rejects.toBeInstanceOf(InvalidTaxRuleError);
  });

  it('rejects a non-zero rate for EXEMPT', async () => {
    const { engine } = setup();
    await expect(engine.createTaxRule(ORG, { name: 'Bad', taxType: 'EXEMPT', ratePct: '1' })).rejects.toBeInstanceOf(InvalidTaxRuleError);
  });
});

describe('TaxEngine — update/activate/deactivate', () => {
  it('updateTaxRule() changes the rate', async () => {
    const { engine } = setup();
    const rule = await engine.createTaxRule(ORG, { name: 'VAT', taxType: 'VAT', ratePct: '15' });
    const updated = await engine.updateTaxRule(ORG, rule.id, { ratePct: '20' });
    expect(updated.ratePct).toBe('20');
  });

  it('updateTaxRule() rejects a non-zero rate on a ZERO_RATED rule', async () => {
    const { engine } = setup();
    const rule = await engine.createTaxRule(ORG, { name: 'ZR', taxType: 'ZERO_RATED', ratePct: '0' });
    await expect(engine.updateTaxRule(ORG, rule.id, { ratePct: '5' })).rejects.toBeInstanceOf(InvalidTaxRuleError);
  });

  it('deactivateTaxRule()/activateTaxRule() toggle active', async () => {
    const { engine } = setup();
    const rule = await engine.createTaxRule(ORG, { name: 'VAT', taxType: 'VAT', ratePct: '15' });
    const deactivated = await engine.deactivateTaxRule(ORG, rule.id);
    expect(deactivated.active).toBe(false);
    const reactivated = await engine.activateTaxRule(ORG, rule.id);
    expect(reactivated.active).toBe(true);
  });

  it('throws TaxRuleNotFoundError for an unknown rule', async () => {
    const { engine } = setup();
    await expect(engine.updateTaxRule(ORG, 'missing', {})).rejects.toBeInstanceOf(TaxRuleNotFoundError);
  });
});

describe('TaxEngine — calculateAndRecord', () => {
  it('computes and persists a tax calculation, publishing tax.calculated', async () => {
    const eventBus = createFinanceEventBus();
    const { engine } = setup(eventBus);
    const rule = await engine.createTaxRule(ORG, { name: 'VAT', taxType: 'VAT', ratePct: '15' });
    let seen: unknown;
    eventBus.subscribe('tax.calculated', (payload) => (seen = payload));
    const calculation = await engine.calculateAndRecord(ORG, rule.id, '200.00');
    expect(calculation.taxAmount).toBe('30.00');
    expect(calculation.totalAmount).toBe('230.00');
    expect(seen).toEqual({ organizationId: ORG, taxCalculationId: calculation.id, taxRuleId: rule.id, taxAmount: '30.00' });
  });

  it('throws TaxRuleNotFoundError for an unknown rule', async () => {
    const { engine } = setup();
    await expect(engine.calculateAndRecord(ORG, 'missing', '100.00')).rejects.toBeInstanceOf(TaxRuleNotFoundError);
  });

  it('produces a 0 tax amount for an EXEMPT rule', async () => {
    const { engine } = setup();
    const rule = await engine.createTaxRule(ORG, { name: 'Exempt', taxType: 'EXEMPT', ratePct: '0' });
    const calculation = await engine.calculateAndRecord(ORG, rule.id, '500.00');
    expect(calculation.taxAmount).toBe('0.00');
    expect(calculation.totalAmount).toBe('500.00');
  });

  it('getCalculation()/listCalculations() round-trip', async () => {
    const { engine } = setup();
    const rule = await engine.createTaxRule(ORG, { name: 'VAT', taxType: 'VAT', ratePct: '15' });
    const calculation = await engine.calculateAndRecord(ORG, rule.id, '100.00');
    expect(await engine.getCalculation(ORG, calculation.id)).toEqual(calculation);
    expect(await engine.listCalculations(ORG)).toHaveLength(1);
  });
});

describe('TaxEngine — getTaxRule and org scoping', () => {
  it('getTaxRule() returns null for an unknown rule', async () => {
    const { engine } = setup();
    expect(await engine.getTaxRule(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { engine, ruleRepository } = setup();
    const rule = await engine.createTaxRule(ORG, { name: 'VAT', taxType: 'VAT', ratePct: '15' });
    expect(await ruleRepository.findById('org-2', rule.id)).toBeNull();
  });

  it('updateTaxRule() preserves fields not included in the patch', async () => {
    const { engine } = setup();
    const rule = await engine.createTaxRule(ORG, { name: 'VAT', taxType: 'VAT', ratePct: '15', jurisdiction: 'US' });
    const updated = await engine.updateTaxRule(ORG, rule.id, { name: 'VAT Updated' });
    expect(updated.ratePct).toBe('15');
    expect(updated.jurisdiction).toBe('US');
  });
});

describe('TaxEngine — findByType/listTaxRules', () => {
  it('findByType() filters by tax type', async () => {
    const { engine } = setup();
    await engine.createTaxRule(ORG, { name: 'VAT', taxType: 'VAT', ratePct: '15' });
    await engine.createTaxRule(ORG, { name: 'GST', taxType: 'GST', ratePct: '10' });
    const vatRules = await engine.findByType(ORG, 'VAT');
    expect(vatRules).toHaveLength(1);
    expect(vatRules[0]?.taxType).toBe('VAT');
  });

  it('listTaxRules() is organization-scoped', async () => {
    const { engine } = setup();
    await engine.createTaxRule(ORG, { name: 'VAT', taxType: 'VAT', ratePct: '15' });
    expect(await engine.listTaxRules(ORG)).toHaveLength(1);
    expect(await engine.listTaxRules('org-2')).toHaveLength(0);
  });
});
