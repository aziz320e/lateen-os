/**
 * Real Tax Engine — configurable, deterministic tax rules for VAT,
 * GST, Sales Tax, Zero-rated, and Exempt, plus recorded calculations.
 * `ZERO_RATED` and `EXEMPT` rules are enforced to carry a `0` rate at
 * creation time — there is no calculation path that could produce a
 * non-zero tax amount for either.
 *
 * @module tax/engine.impl
 */
import { addAmounts, isZeroAmount, percentageOf } from '../shared/decimal.js';
import type { FinanceEventBus } from '../events/finance-event-bus.js';
import { InvalidTaxRuleError, TaxRuleNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, TaxCalculationId, TaxRuleId } from '../shared/identifiers.js';
import type { TaxCalculationRepository, TaxRuleRepository } from './repository.js';
import type { TaxCalculation, TaxRule, TaxType } from './types.js';

/** Pure: `taxableAmount * ratePct / 100`. */
export function calculateTax(taxableAmount: string, ratePct: string): string {
  return percentageOf(taxableAmount, ratePct);
}

function requiresZeroRate(taxType: TaxType): boolean {
  return taxType === 'ZERO_RATED' || taxType === 'EXEMPT';
}

export interface CreateTaxRuleInput {
  readonly name: string;
  readonly taxType: TaxType;
  readonly ratePct: string;
  readonly jurisdiction?: string;
}

export interface UpdateTaxRuleInput {
  readonly name?: string;
  readonly ratePct?: string;
  readonly jurisdiction?: string;
}

export interface TaxEngine {
  createTaxRule(organizationId: OrganizationId, input: CreateTaxRuleInput): Promise<TaxRule>;
  updateTaxRule(organizationId: OrganizationId, taxRuleId: TaxRuleId, input: UpdateTaxRuleInput): Promise<TaxRule>;
  activateTaxRule(organizationId: OrganizationId, taxRuleId: TaxRuleId): Promise<TaxRule>;
  deactivateTaxRule(organizationId: OrganizationId, taxRuleId: TaxRuleId): Promise<TaxRule>;
  getTaxRule(organizationId: OrganizationId, taxRuleId: TaxRuleId): Promise<TaxRule | null>;
  listTaxRules(organizationId: OrganizationId): Promise<readonly TaxRule[]>;
  findByType(organizationId: OrganizationId, taxType: TaxType): Promise<readonly TaxRule[]>;

  /** Computes and persists a {@link TaxCalculation} for `taxableAmount` against the given rule. Publishes `tax.calculated`. */
  calculateAndRecord(organizationId: OrganizationId, taxRuleId: TaxRuleId, taxableAmount: string): Promise<TaxCalculation>;
  getCalculation(organizationId: OrganizationId, taxCalculationId: TaxCalculationId): Promise<TaxCalculation | null>;
  listCalculations(organizationId: OrganizationId): Promise<readonly TaxCalculation[]>;
}

/** Creates a real {@link TaxEngine}. */
export function createTaxEngine(
  ruleRepository: TaxRuleRepository,
  calculationRepository: TaxCalculationRepository,
  eventBus?: FinanceEventBus,
  now: () => string = nowIso,
): TaxEngine {
  async function requireRule(organizationId: OrganizationId, taxRuleId: TaxRuleId): Promise<TaxRule> {
    const rule = await ruleRepository.findById(organizationId, taxRuleId);
    if (!rule) throw new TaxRuleNotFoundError(taxRuleId);
    return rule;
  }

  function assertValidRate(taxType: TaxType, ratePct: string): void {
    if (requiresZeroRate(taxType) && !isZeroAmount(ratePct)) {
      throw new InvalidTaxRuleError(`${taxType} rules must have a rate of 0, got ${ratePct}`);
    }
  }

  return {
    async createTaxRule(organizationId, input) {
      assertValidRate(input.taxType, input.ratePct);
      const timestamp = now();
      const rule: TaxRule = {
        id: generateId('tax-rule'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        taxType: input.taxType,
        ratePct: input.ratePct,
        jurisdiction: input.jurisdiction,
        active: true,
      };
      await ruleRepository.save(rule);
      return rule;
    },

    async updateTaxRule(organizationId, taxRuleId, input) {
      const rule = await requireRule(organizationId, taxRuleId);
      const ratePct = input.ratePct ?? rule.ratePct;
      assertValidRate(rule.taxType, ratePct);
      const updated: TaxRule = {
        ...rule,
        name: input.name ?? rule.name,
        ratePct,
        jurisdiction: input.jurisdiction ?? rule.jurisdiction,
        updatedAt: now(),
      };
      await ruleRepository.save(updated);
      return updated;
    },

    async activateTaxRule(organizationId, taxRuleId) {
      const rule = await requireRule(organizationId, taxRuleId);
      const updated: TaxRule = { ...rule, active: true, updatedAt: now() };
      await ruleRepository.save(updated);
      return updated;
    },

    async deactivateTaxRule(organizationId, taxRuleId) {
      const rule = await requireRule(organizationId, taxRuleId);
      const updated: TaxRule = { ...rule, active: false, updatedAt: now() };
      await ruleRepository.save(updated);
      return updated;
    },

    async getTaxRule(organizationId, taxRuleId) {
      return ruleRepository.findById(organizationId, taxRuleId);
    },

    async listTaxRules(organizationId) {
      return ruleRepository.findAll(organizationId);
    },

    async findByType(organizationId, taxType) {
      return ruleRepository.findByType(organizationId, taxType);
    },

    async calculateAndRecord(organizationId, taxRuleId, taxableAmount) {
      const rule = await requireRule(organizationId, taxRuleId);
      const taxAmount = calculateTax(taxableAmount, rule.ratePct);
      const timestamp = now();
      const calculation: TaxCalculation = {
        id: generateId('tax-calculation'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        taxRuleId,
        taxableAmount,
        taxAmount,
        totalAmount: addAmounts(taxableAmount, taxAmount),
        calculatedAt: timestamp,
      };
      await calculationRepository.save(calculation);
      eventBus?.publish('tax.calculated', { organizationId, taxCalculationId: calculation.id, taxRuleId, taxAmount });
      return calculation;
    },

    async getCalculation(organizationId, taxCalculationId) {
      return calculationRepository.findById(organizationId, taxCalculationId);
    },

    async listCalculations(organizationId) {
      return calculationRepository.findAll(organizationId);
    },
  };
}
