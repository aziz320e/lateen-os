/**
 * Real {@link ProviderHealth} implementation. Defaults to a genuine HTTP
 * liveness probe against each provider's configured base URL (no API key
 * required — an unauthenticated 4xx still proves the endpoint is reachable).
 * The probe is injectable so tests never need live network access.
 *
 * @module provider/health.impl
 */
import type { ProviderId } from '../shared/identifiers.js';
import type { ProviderHealthSnapshot, ProviderRegistration, ProviderStatus } from './types.js';
import type { ProviderHealth } from './health.js';
import type { ProviderRegistry } from './registry.js';

export interface ProviderHealthCheckResult {
  readonly status: ProviderStatus;
  readonly latencyMs?: number;
  readonly message?: string;
}

export type ProviderHealthCheckFn = (registration: ProviderRegistration) => Promise<ProviderHealthCheckResult>;

export interface CreateProviderHealthOptions {
  readonly checkTimeoutMs?: number;
  /** Overrides the built-in HTTP-liveness probe — used by tests to avoid real network calls. */
  readonly check?: ProviderHealthCheckFn;
}

function defaultHttpLivenessCheck(timeoutMs: number): ProviderHealthCheckFn {
  return async (registration) => {
    const baseUrl = registration.configuration.baseUrl ?? registration.metadata.defaultBaseUrl;
    if (!baseUrl) {
      return { status: 'unavailable', message: 'No base URL configured for this provider' };
    }
    const started = Date.now();
    try {
      const response = await fetch(baseUrl, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) });
      const latencyMs = Date.now() - started;
      // A 4xx (e.g. missing auth/path) still proves the endpoint is reachable — only 5xx/network errors are "unavailable".
      if (response.status >= 500) {
        return { status: 'degraded', latencyMs, message: `HTTP ${response.status}` };
      }
      return { status: response.ok ? 'active' : 'degraded', latencyMs };
    } catch (error) {
      return {
        status: 'unavailable',
        latencyMs: Date.now() - started,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  };
}

/** Creates a {@link ProviderHealth} checker over the given {@link ProviderRegistry}. */
export function createProviderHealth(
  registry: ProviderRegistry,
  options: CreateProviderHealthOptions = {},
): ProviderHealth {
  const check = options.check ?? defaultHttpLivenessCheck(options.checkTimeoutMs ?? 3000);

  async function checkOne(providerId: ProviderId): Promise<ProviderHealthSnapshot> {
    const registration = registry.get(providerId);
    if (!registration) {
      throw new Error(`Provider "${providerId}" is not registered`);
    }
    const result = await check(registration);
    return {
      providerId,
      kind: registration.metadata.kind,
      status: result.status,
      latencyMs: result.latencyMs,
      lastCheckedAt: new Date().toISOString(),
      message: result.message,
    };
  }

  return {
    check: checkOne,
    async checkAll() {
      return Promise.all(registry.list().map((registration) => checkOne(registration.metadata.id)));
    },
    async checkByKind(kind) {
      return Promise.all(registry.findByKind(kind).map((registration) => checkOne(registration.metadata.id)));
    },
    async isAvailable(providerId) {
      const snapshot = await checkOne(providerId);
      return snapshot.status === 'active' || snapshot.status === 'degraded';
    },
  };
}
