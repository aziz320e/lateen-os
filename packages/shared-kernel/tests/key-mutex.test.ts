import { describe, expect, it } from 'vitest';
import { createKeyMutex } from '../src/concurrency/key-mutex.js';

describe('createKeyMutex', () => {
  it('serializes calls for the same key: the second never starts until the first has fully settled', async () => {
    const mutex = createKeyMutex();
    const order: string[] = [];
    const record = async (label: string) => {
      order.push(`${label}-start`);
      await Promise.resolve();
      await Promise.resolve();
      order.push(`${label}-end`);
    };
    await Promise.all([
      mutex.runExclusive('k', () => record('A')),
      mutex.runExclusive('k', () => record('B')),
    ]);
    expect(order).toEqual(['A-start', 'A-end', 'B-start', 'B-end']);
  });

  it('does not serialize calls for different keys', async () => {
    const mutex = createKeyMutex();
    const order: string[] = [];
    const record = async (label: string) => {
      order.push(`${label}-start`);
      await Promise.resolve();
      order.push(`${label}-end`);
    };
    await Promise.all([
      mutex.runExclusive('k1', () => record('A')),
      mutex.runExclusive('k2', () => record('B')),
    ]);
    // Both start before either ends -- they ran concurrently, not queued.
    expect(order.indexOf('B-start')).toBeLessThan(order.indexOf('A-end'));
  });

  it('propagates a rejection to the caller without wedging later calls for the same key', async () => {
    const mutex = createKeyMutex();
    await expect(
      mutex.runExclusive('k', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    // A failed operation must not permanently block the key.
    const result = await mutex.runExclusive('k', async () => 'ok');
    expect(result).toBe('ok');
  });

  it('queues same-key calls in call order, each seeing the effect of the one before it', async () => {
    const mutex = createKeyMutex();
    let counter = 0;
    const increments = await Promise.all(
      Array.from({ length: 20 }, () =>
        mutex.runExclusive('counter', async () => {
          const current = counter;
          await Promise.resolve(); // real await gap between read and write
          counter = current + 1;
          return counter;
        }),
      ),
    );
    // If any two increments had interleaved, the final counter would be
    // less than 20 and/or two calls would report the same value.
    expect(counter).toBe(20);
    expect(new Set(increments).size).toBe(20);
  });
});
