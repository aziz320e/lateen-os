import { describe, expect, it, vi } from 'vitest';
import { createLogger } from '../src/observability/logger.js';
import { withRetry } from '../src/observability/retry.js';
import { withSpan } from '../src/observability/span.js';

describe('createLogger', () => {
  it('creates a pino logger with a service base field', () => {
    const logger = createLogger('test-service');
    expect(logger.level).toBe('info');
    expect(logger.bindings()).toMatchObject({ service: 'test-service' });
  });

  it('honors an explicit level and environment', () => {
    const logger = createLogger('test-service', { level: 'debug', environment: 'staging' });
    expect(logger.level).toBe('debug');
    expect(logger.bindings()).toMatchObject({ service: 'test-service', environment: 'staging' });
  });
});

describe('withRetry', () => {
  it('returns the result on first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries until success within maxAttempts', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the last error once attempts are exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(withRetry(fn, { maxAttempts: 2, baseDelayMs: 1 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('stops retrying immediately when shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));
    const shouldRetry = vi.fn().mockReturnValue(false);
    await expect(withRetry(fn, { maxAttempts: 5, baseDelayMs: 1, shouldRetry })).rejects.toThrow('non-retryable');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('invokes onRetry with the attempt and computed delay', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('ok');
    const onRetry = vi.fn();
    await withRetry(fn, { baseDelayMs: 10, onRetry });
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 10);
  });
});

describe('withSpan', () => {
  it('returns the wrapped function result', async () => {
    const result = await withSpan('test-tracer', 'test-span', async () => 'value');
    expect(result).toBe('value');
  });

  it('propagates errors thrown inside the span', async () => {
    await expect(
      withSpan('test-tracer', 'test-span', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});
