/**
 * Monetary amount value object.
 *
 * Amounts are represented as decimal strings to avoid floating-point precision loss.
 * Arithmetic and formatting are infrastructure/application concerns.
 *
 * @module common/money
 */

/** ISO 4217 currency code (e.g. SAR, USD). */
export type CurrencyCode = string;

/** Monetary amount with currency. */
export interface Money {
  readonly amount: string;
  readonly currency: CurrencyCode;
}
