/**
 * Shared retry-with-backoff utility. Generalizes the pattern already used
 * ad hoc in `packages/connector-base/src/telemetry.ts` so every package can
 * depend on one implementation instead of reimplementing it.
 *
 * @module observability/retry
 */

export interface RetryOptions {
  /** Maximum number of attempts, including the first. Defaults to 3. */
  readonly maxAttempts?: number;
  /** Base delay in milliseconds; actual delay is `baseDelayMs * attempt`. Defaults to 250. */
  readonly baseDelayMs?: number;
  /** Decide whether a given error/attempt should be retried. Defaults to always retry until maxAttempts. */
  readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Observe a retry before the delay is awaited (for logging/telemetry). */
  readonly onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

/** Runs `fn`, retrying with linear backoff until it succeeds or attempts are exhausted. */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 250;
  const shouldRetry = options.shouldRetry ?? (() => true);
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
        break;
      }
      const delayMs = baseDelayMs * attempt;
      options.onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
