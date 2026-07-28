/**
 * Deterministic decimal-string money arithmetic, shared by modules
 * that touch value figures (Renewals, Expansion). Amounts are decimal
 * strings (see `@lateen-os/shared-kernel`'s {@link Money}) — this
 * module is the single place that parses and re-formats them.
 *
 * @module shared/decimal
 */

/** Parses a decimal string amount, defaulting to `0` for `undefined`/invalid input. */
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
