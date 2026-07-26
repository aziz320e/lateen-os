import { describe, expect, it } from 'vitest';
import { canRetry, computeRetryDelayMs, runWithRetryPolicy } from '../src/execution/retry.js';
import type { RetryPolicy } from '../src/execution/types.js';

describe('computeRetryDelayMs', () => {
  it('returns a constant delay for fixed backoff', () => {
    const policy: RetryPolicy = { maxAttempts: 5, backoff: 'fixed', initialDelayMs: 100 };
    expect(computeRetryDelayMs(policy, 1)).toBe(100);
    expect(computeRetryDelayMs(policy, 3)).toBe(100);
  });

  it('doubles per attempt for exponential backoff', () => {
    const policy: RetryPolicy = { maxAttempts: 5, backoff: 'exponential', initialDelayMs: 10 };
    expect(computeRetryDelayMs(policy, 1)).toBe(10);
    expect(computeRetryDelayMs(policy, 2)).toBe(20);
    expect(computeRetryDelayMs(policy, 3)).toBe(40);
  });

  it('caps exponential backoff at maxDelayMs', () => {
    const policy: RetryPolicy = { maxAttempts: 10, backoff: 'exponential', initialDelayMs: 10, maxDelayMs: 25 };
    expect(computeRetryDelayMs(policy, 4)).toBe(25); // uncapped would be 80
  });
});

describe('canRetry', () => {
  it('allows another attempt below maxAttempts', () => {
    expect(canRetry({ maxAttempts: 3, backoff: 'fixed', initialDelayMs: 0 }, 1)).toBe(true);
    expect(canRetry({ maxAttempts: 3, backoff: 'fixed', initialDelayMs: 0 }, 2)).toBe(true);
  });

  it('disallows once maxAttempts is reached', () => {
    expect(canRetry({ maxAttempts: 3, backoff: 'fixed', initialDelayMs: 0 }, 3)).toBe(false);
  });
});

describe('runWithRetryPolicy', () => {
  it('succeeds on the first attempt without retrying', async () => {
    let calls = 0;
    const { result, attempts } = await runWithRetryPolicy(async () => {
      calls += 1;
      return 'ok';
    }, { maxAttempts: 3, backoff: 'fixed', initialDelayMs: 1 });

    expect(result).toBe('ok');
    expect(attempts).toBe(1);
    expect(calls).toBe(1);
  });

  it('retries on failure and succeeds within maxAttempts', async () => {
    let calls = 0;
    const { result, attempts } = await runWithRetryPolicy(async (attempt) => {
      calls += 1;
      if (attempt < 3) throw new Error('not yet');
      return 'ok';
    }, { maxAttempts: 5, backoff: 'fixed', initialDelayMs: 1 });

    expect(result).toBe('ok');
    expect(attempts).toBe(3);
    expect(calls).toBe(3);
  });

  it('throws the last error once attempts are exhausted', async () => {
    let calls = 0;
    await expect(
      runWithRetryPolicy(async () => {
        calls += 1;
        throw new Error(`fail ${calls}`);
      }, { maxAttempts: 3, backoff: 'fixed', initialDelayMs: 1 }),
    ).rejects.toThrow('fail 3');
    expect(calls).toBe(3);
  });
});
