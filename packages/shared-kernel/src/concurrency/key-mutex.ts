/**
 * A per-key async mutex for a single Node.js process. Serializes
 * concurrent async "read, compute, write" sequences that target the
 * same logical record (e.g. the same invoice, the same stock level),
 * so two overlapping calls for that key can never both read stale
 * state and race to overwrite each other's result. Operations against
 * *different* keys are never blocked by one another.
 *
 * This is an in-process concurrency primitive, not a distributed lock
 * — it serializes interleaved async operations within one Node.js
 * event loop (the actual race this fixes: two concurrent requests
 * handled by the same process interleaving at an `await` boundary). It
 * does not, and is not intended to, coordinate across multiple
 * processes or a real external datastore.
 *
 * @module concurrency/key-mutex
 */

export interface KeyMutex {
  /**
   * Runs `fn` exclusively with respect to any other `runExclusive` call
   * for the same `key` on this mutex — queued in call order, never
   * rejected outright, so callers never need to retry on contention.
   * Calls for different keys run fully concurrently, unaffected.
   */
  runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T>;
}

/** Creates a new, empty {@link KeyMutex}. */
export function createKeyMutex(): KeyMutex {
  const tail = new Map<string, Promise<void>>();

  return {
    runExclusive(key, fn) {
      const previous = tail.get(key) ?? Promise.resolve();
      const run = previous.then(fn, fn);
      const settled = run.then(
        () => undefined,
        () => undefined,
      );
      tail.set(key, settled);
      // Bound the map to keys with in-flight or just-finished work: once
      // this call's link is still the newest one queued for `key` (i.e.
      // nothing queued behind it while it ran), drop the entry rather
      // than retaining a resolved promise for every key ever used.
      void settled.then(() => {
        if (tail.get(key) === settled) tail.delete(key);
      });
      return run;
    },
  };
}
