/**
 * Deterministic decimal-string money/percentage arithmetic, shared by
 * every HR Engine module that touches money (Payroll) or weighted
 * scores (Performance). Amounts are decimal strings (see
 * `@lateen-os/shared-kernel`'s {@link Money}) — this module is the
 * single place that parses and re-formats them.
 *
 * @module shared/decimal
 */

/** Parses a decimal string amount, defaulting to `0` for `undefined`/non-finite input. */
export function parseDecimal(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Formats a number as a fixed 2-decimal-place money string. */
export function toMoney(value: number): string {
  return value.toFixed(2);
}

/** `a + b`, both decimal strings. */
export function addAmounts(a: string, b: string): string {
  return toMoney(parseDecimal(a) + parseDecimal(b));
}

/** `a - b`, both decimal strings. */
export function subtractAmounts(a: string, b: string): string {
  return toMoney(parseDecimal(a) - parseDecimal(b));
}

/** `amount * factor`, decimal string times a plain number. */
export function multiplyAmount(amount: string, factor: number): string {
  return toMoney(parseDecimal(amount) * factor);
}

/** `amount * pct / 100`. */
export function percentageOf(amount: string, pct: string | undefined): string {
  return toMoney(parseDecimal(amount) * (parseDecimal(pct) / 100));
}

/** Sums a list of decimal-string amounts. */
export function sumAmounts(amounts: readonly string[]): string {
  return toMoney(amounts.reduce((total, amount) => total + parseDecimal(amount), 0));
}

/** `-1` if `a < b`, `0` if equal (to cent precision), `1` if `a > b`. */
export function compareAmounts(a: string, b: string): -1 | 0 | 1 {
  const diff = parseDecimal(a) - parseDecimal(b);
  if (Math.abs(diff) < 0.005) return 0;
  return diff < 0 ? -1 : 1;
}
