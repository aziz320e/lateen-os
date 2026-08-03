import { describe, expect, it } from 'vitest';
import {
  addAmounts,
  compareAmounts,
  isZeroAmount,
  multiplyAmount,
  negateAmount,
  parseDecimal,
  percentageOf,
  subtractAmounts,
  sumAmounts,
  toMoney,
} from '../src/shared/decimal.js';
import { addDaysIso, addMonthsIso, daysBetweenIso } from '../src/shared/date.js';
import { generateId, nowIso } from '../src/shared/id.js';

describe('shared/decimal', () => {
  it('parseDecimal defaults to 0 for undefined/invalid input', () => {
    expect(parseDecimal(undefined)).toBe(0);
    expect(parseDecimal('not-a-number')).toBe(0);
    expect(parseDecimal('12.5')).toBe(12.5);
  });

  it('toMoney formats to 2 decimal places', () => {
    expect(toMoney(1)).toBe('1.00');
    // `1.005` as a JS number literal is already stored as
    // 1.00499999999999989... (IEEE-754 cannot represent it exactly) before
    // this function ever runs. A prior version of `toMoney` fed this
    // straight into `Number.prototype.toFixed`, which rounded the
    // already-corrupted value down to '1.00' -- silently wrong for any
    // exact-half-cent result. `toMoney` now rounds through `toFixed(8)`
    // first, which absorbs that ~1e-16 representation noise and correctly
    // rounds the true boundary value up to '1.01'.
    expect(toMoney(1.005)).toBe('1.01');
    expect(toMoney(-3.456)).toBe('-3.46');
  });

  it('addAmounts / subtractAmounts', () => {
    expect(addAmounts('10.50', '5.25')).toBe('15.75');
    expect(subtractAmounts('10.50', '5.25')).toBe('5.25');
    expect(subtractAmounts('5', '10')).toBe('-5.00');
  });

  it('multiplyAmount', () => {
    expect(multiplyAmount('10.00', 3)).toBe('30.00');
    expect(multiplyAmount('10.00', 0.5)).toBe('5.00');
  });

  it('percentageOf', () => {
    expect(percentageOf('200.00', '15')).toBe('30.00');
    expect(percentageOf('200.00', undefined)).toBe('0.00');
  });

  it('sumAmounts', () => {
    expect(sumAmounts(['1.10', '2.20', '3.30'])).toBe('6.60');
    expect(sumAmounts([])).toBe('0.00');
  });

  it('compareAmounts', () => {
    expect(compareAmounts('10.00', '10.00')).toBe(0);
    expect(compareAmounts('10.001', '10.002')).toBe(0);
    expect(compareAmounts('9.00', '10.00')).toBe(-1);
    expect(compareAmounts('11.00', '10.00')).toBe(1);
  });

  it('isZeroAmount', () => {
    expect(isZeroAmount('0.00')).toBe(true);
    expect(isZeroAmount('0.001')).toBe(true);
    expect(isZeroAmount('0.01')).toBe(false);
  });

  it('negateAmount', () => {
    expect(negateAmount('5.00')).toBe('-5.00');
    expect(negateAmount('-5.00')).toBe('5.00');
  });
});

describe('shared/decimal — monetary precision regression (Finance precision finding)', () => {
  it('percentageOf resolves an exact half-cent tax boundary correctly, instead of silently rounding down', () => {
    // 1.5% of $67.00 = $1.005 exactly -- an ordinary, realistic tax-rate
    // calculation, not a contrived edge case. The prior implementation
    // computed this via `parseFloat('67.00') * (parseFloat('1.5') / 100)`,
    // which IEEE-754 corrupts to 1.0049999999999999 *before* rounding,
    // so `.toFixed(2)` produced '1.00' -- a real cent of tax silently
    // never collected. Whole-cent arithmetic reaches the exact
    // intermediate value 100.5 (cents), rounding correctly to '1.01'.
    expect(percentageOf('67.00', '1.5')).toBe('1.01');
  });

  it('summing many lines remains exact at volumes where the prior float accumulation measurably drifted', () => {
    // 10,000 lines of $0.10 each. Reduced via native `+=`, the float 0.1
    // (not exactly representable in binary) drifts to a raw pre-rounding
    // sum of 1000.0000000001588, not the true 1000 -- confirmed by
    // directly probing the prior implementation. That specific drift
    // happened to still round to the correct '1000.00' under the old
    // `.toFixed(2)` (the error is ~13 orders of magnitude smaller than a
    // cent), so this is not a case where the old code was observably
    // wrong -- it demonstrates the new whole-cent accumulation has no
    // such drift *by construction*, rather than by getting lucky with
    // where the rounding boundary happens to fall.
    const lines = Array.from({ length: 10_000 }, () => '0.10');
    expect(sumAmounts(lines)).toBe('1000.00');
  });

  it('compareAmounts has no tolerance left to reason about: equality is exact whole-cent equality', () => {
    // The prior implementation compared amounts by checking whether their
    // raw parsed-float difference was smaller than a fixed 0.005
    // magic-number tolerance -- sized to mask float noise (~1e-10 at
    // realistic volumes, per the test above) but nothing about that
    // mechanism actually bounded it to float-noise magnitudes; it would
    // have silently accepted any two amounts genuinely within half a real
    // cent of each other as equal, by construction, with no way to tell
    // "this is float noise" apart from "this is a real difference someone
    // should see". Comparison is now exact integer-cent equality with no
    // epsilon of any kind -- two amounts are equal if and only if they
    // round to the identical cent value.
    expect(compareAmounts('100.01', '100.00')).toBe(1);
    expect(compareAmounts('99.99', '100.00')).toBe(-1);
    expect(compareAmounts('100.00', '100.00')).toBe(0);
  });
});

describe('shared/date', () => {
  it('addMonthsIso adds months within the same year', () => {
    expect(addMonthsIso('2026-01-15', 2)).toBe('2026-03-15');
  });

  it('addMonthsIso rolls over into the next year', () => {
    expect(addMonthsIso('2026-11-01', 3)).toBe('2027-02-01');
  });

  it('addMonthsIso clamps the day to the shorter target month', () => {
    expect(addMonthsIso('2026-01-31', 1)).toBe('2026-02-28');
  });

  it('addDaysIso adds days across a month boundary', () => {
    expect(addDaysIso('2026-01-30', 5)).toBe('2026-02-04');
  });

  it('daysBetweenIso is positive when `to` is after `from`', () => {
    expect(daysBetweenIso('2026-01-01', '2026-01-31')).toBe(30);
  });

  it('daysBetweenIso is negative when `to` precedes `from`', () => {
    expect(daysBetweenIso('2026-01-31', '2026-01-01')).toBe(-30);
  });

  it('daysBetweenIso is 0 for the same date', () => {
    expect(daysBetweenIso('2026-01-01', '2026-01-01')).toBe(0);
  });
});

describe('shared/id', () => {
  it('generateId includes the given prefix', () => {
    expect(generateId('account')).toMatch(/^account-/);
  });

  it('generateId produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });

  it('nowIso returns a valid ISO timestamp', () => {
    expect(() => new Date(nowIso()).toISOString()).not.toThrow();
  });
});
