/**
 * Real retry-policy math and a runner built on it. A workflow-level
 * {@link RetryPolicy} is a persisted, storable domain concept (attachable
 * to a step definition), distinct from shared-kernel's `RetryOptions`
 * (an ephemeral function-call options bag with linear-only backoff) — this
 * module fills the gap for 'fixed' vs 'exponential' backoff with a cap.
 *
 * @module execution/retry
 */
import type { RetryPolicy } from './types.js';

/** Computes the delay before the given attempt (1-indexed) under `policy`. */
export function computeRetryDelayMs(policy: RetryPolicy, attempt: number): number {
  const raw =
    policy.backoff === 'exponential'
      ? policy.initialDelayMs * 2 ** (attempt - 1)
      : policy.initialDelayMs;
  return policy.maxDelayMs !== undefined ? Math.min(raw, policy.maxDelayMs) : raw;
}

/** Whether another attempt is allowed after a failed `attempt` (1-indexed). */
export function canRetry(policy: RetryPolicy, attempt: number): boolean {
  return attempt < policy.maxAttempts;
}

export interface RetryPolicyResult<T> {
  readonly result: T;
  readonly attempts: number;
}

/** Runs `fn`, retrying per `policy` on rejection. Real backoff delay is awaited between attempts. */
export async function runWithRetryPolicy<T>(fn: (attempt: number) => Promise<T>, policy: RetryPolicy): Promise<RetryPolicyResult<T>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      const result = await fn(attempt);
      return { result, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (!canRetry(policy, attempt)) break;
      await sleep(computeRetryDelayMs(policy, attempt));
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
