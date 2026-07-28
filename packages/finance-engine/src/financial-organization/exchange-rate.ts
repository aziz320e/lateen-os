/**
 * Exchange Rate Provider abstraction — the Finance Engine never
 * fetches live FX rates; it depends only on this port, which the
 * composition root may leave as the deterministic default (identity
 * for same-currency conversion, `null` for anything else) or replace
 * with a seeded, still fully offline, static-rate table.
 *
 * @module financial-organization/exchange-rate
 */
import { parseDecimal, toMoney } from '../shared/decimal.js';
import type { CurrencyCode, ISODateTime, Money } from '../shared/primitives.js';

export interface ExchangeRate {
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly rate: string;
  readonly asOf: ISODateTime;
}

/** Deterministic, offline FX abstraction. Implementations must never perform network I/O. */
export interface ExchangeRateProvider {
  /** The applicable rate for `from` -> `to` at (or immediately before) `asOf`. `null` if none is known. */
  getRate(from: CurrencyCode, to: CurrencyCode, asOf?: ISODateTime): Promise<ExchangeRate | null>;
  /** Converts `money` into `toCurrency`. `null` if no rate is known and the currencies differ. */
  convert(money: Money, toCurrency: CurrencyCode, asOf?: ISODateTime): Promise<Money | null>;
}

/**
 * Creates a deterministic, in-memory {@link ExchangeRateProvider} over a
 * seeded, static rate table. Same-currency conversion always returns
 * rate `"1"` regardless of the seed. For a pair with multiple seeded
 * rates, the one with the latest `asOf` at or before the requested
 * `asOf` (defaulting to the latest seeded rate overall) is used.
 */
export function createStaticExchangeRateProvider(seed: readonly ExchangeRate[] = []): ExchangeRateProvider {
  const rates = [...seed].sort((a, b) => (a.asOf < b.asOf ? -1 : a.asOf > b.asOf ? 1 : 0));

  async function getRate(from: CurrencyCode, to: CurrencyCode, asOf?: ISODateTime): Promise<ExchangeRate | null> {
    if (from === to) {
      return { fromCurrency: from, toCurrency: to, rate: '1', asOf: asOf ?? new Date().toISOString() };
    }
    const candidates = rates.filter((rate) => rate.fromCurrency === from && rate.toCurrency === to && (asOf === undefined || rate.asOf <= asOf));
    return candidates[candidates.length - 1] ?? null;
  }

  return {
    getRate,

    async convert(money, toCurrency, asOf) {
      if (money.currency === toCurrency) return money;
      const rate = await getRate(money.currency, toCurrency, asOf);
      if (!rate) return null;
      return { amount: toMoney(parseDecimal(money.amount) * parseDecimal(rate.rate)), currency: toCurrency };
    },
  };
}
