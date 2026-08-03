/**
 * Deterministic decimal-string money/percentage arithmetic, shared by
 * every Finance Engine module. Amounts are represented as decimal
 * strings (see `@lateen-os/shared-kernel`'s {@link Money}, whose own
 * doc comment states the reason: "to avoid floating-point precision
 * loss") — this module is the single place that parses and re-formats
 * them, so every computation across the package rounds the same way.
 *
 * Every operation below is performed in exact whole cents (parsed
 * directly from the decimal string's digits, never through
 * `Number.parseFloat`) rather than native floating-point numbers, so
 * addition, subtraction, summation, and comparison are exact — not
 * subject to IEEE-754 binary-fraction representation error. Only
 * JavaScript's native (exact) integer arithmetic is used, safe up to
 * 2^53, far beyond any realistic monetary amount.
 *
 * @module shared/decimal
 */

/** Parses a decimal string into exact whole cents (e.g. `"10.50"` -> `1050`). Never routes through `Number.parseFloat` on the original string, so it cannot inherit binary floating-point representation error. Returns `0` for `undefined`/malformed input. Rounds (half up) any digits past the second decimal place. */
function parseCents(value: string | undefined): number {
  if (!value) return 0;
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) return 0;
  const [, sign, whole, fraction = ''] = match;
  const threeDigits = `${fraction}000`.slice(0, 3);
  const cents =
    Number(whole) * 100 + Number(threeDigits.slice(0, 2)) + (Number(threeDigits[2]) >= 5 ? 1 : 0);
  return sign === '-' ? -cents : cents;
}

/** Formats a whole-cents value back into a fixed 2-decimal-place money string. `toFixed(8)` absorbs any binary-fraction noise that can appear when `cents` was derived from a raw floating-point input (e.g. `toMoney`'s own `number` parameter) rather than `parseCents()`, which never produces that noise to begin with. */
function formatCents(cents: number): string {
  const rounded = Math.round(Number(cents.toFixed(8)));
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${sign}${whole}.${String(frac).padStart(2, '0')}`;
}

/** Parses a decimal string amount, defaulting to `0` for `undefined`/non-finite input. */
export function parseDecimal(value: string | undefined): number {
  return parseCents(value) / 100;
}

/** Formats a number as a fixed 2-decimal-place money string. */
export function toMoney(value: number): string {
  return formatCents(value * 100);
}

/** `a + b`, both decimal strings. */
export function addAmounts(a: string, b: string): string {
  return formatCents(parseCents(a) + parseCents(b));
}

/** `a - b`, both decimal strings. */
export function subtractAmounts(a: string, b: string): string {
  return formatCents(parseCents(a) - parseCents(b));
}

/** `amount * factor`, decimal string times a plain number. */
export function multiplyAmount(amount: string, factor: number): string {
  return formatCents(parseCents(amount) * factor);
}

/** `amount * pct / 100`. */
export function percentageOf(amount: string, pct: string | undefined): string {
  return formatCents((parseCents(amount) * parseCents(pct)) / 10000);
}

/** Sums a list of decimal-string amounts. */
export function sumAmounts(amounts: readonly string[]): string {
  return formatCents(amounts.reduce((total, amount) => total + parseCents(amount), 0));
}

/** `-1` if `a < b`, `0` if equal, `1` if `a > b` — exact whole-cent comparison, no tolerance. */
export function compareAmounts(a: string, b: string): -1 | 0 | 1 {
  const diff = parseCents(a) - parseCents(b);
  if (diff === 0) return 0;
  return diff < 0 ? -1 : 1;
}

/** Whether a decimal-string amount is exactly zero. */
export function isZeroAmount(amount: string): boolean {
  return parseCents(amount) === 0;
}

/** `-amount`. */
export function negateAmount(amount: string): string {
  return formatCents(-parseCents(amount));
}
