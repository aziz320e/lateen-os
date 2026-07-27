/**
 * Real Security Analytics engine — authentication failures,
 * authorization failures, threat detections, blocked tools, blocked
 * providers, and policy violations. Composes the real, optional AI
 * Security Engine query port and event bus (never a repository).
 *
 * Authentication/authorization/policy failures and threat detections
 * are derived from the shared, immutable `findViolations()` /
 * `findThreats()` streams. Blocked tools and blocked providers are
 * different: AI Security Engine's Tool Security and Provider Security
 * modules publish `tool.blocked` / `provider.blocked` but deliberately
 * never write them to the shared audit sink (they are transient,
 * real-time signals, not persisted records) — so this engine
 * subscribes to the real, injected AI Security Engine event bus once,
 * at construction time, and accumulates real, running per-organization
 * counters from the genuine event stream.
 *
 * @module security-analytics/engine.impl
 */
import type { SecurityRuntime } from '@lateen-os/ai-security-engine';
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, SecurityAnalyticsId } from '../shared/identifiers.js';
import type { SecurityAnalyticsRepository } from './repository.js';
import type { SecurityAnalyticsSnapshot } from './types.js';

export interface SecurityAnalyticsDeps {
  readonly aiSecurity?: Pick<SecurityRuntime, 'queries' | 'events'>;
}

export interface SecurityAnalyticsEngine {
  computeSnapshot(organizationId: OrganizationId): Promise<SecurityAnalyticsSnapshot>;
  get(organizationId: OrganizationId, snapshotId: SecurityAnalyticsId): Promise<SecurityAnalyticsSnapshot | null>;
  list(organizationId: OrganizationId): Promise<readonly SecurityAnalyticsSnapshot[]>;
}

/** Creates a real {@link SecurityAnalyticsEngine} over the optional AI Security Engine collaborator. */
export function createSecurityAnalyticsEngine(
  repository: SecurityAnalyticsRepository,
  deps: SecurityAnalyticsDeps = {},
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): SecurityAnalyticsEngine {
  const blockedToolCounts = new Map<string, number>();
  const blockedProviderCounts = new Map<string, number>();

  deps.aiSecurity?.events.subscribe('tool.blocked', (payload) => {
    blockedToolCounts.set(payload.organizationId, (blockedToolCounts.get(payload.organizationId) ?? 0) + 1);
  });
  deps.aiSecurity?.events.subscribe('provider.blocked', (payload) => {
    blockedProviderCounts.set(payload.organizationId, (blockedProviderCounts.get(payload.organizationId) ?? 0) + 1);
  });

  return {
    async computeSnapshot(organizationId) {
      let authenticationFailures = 0;
      let authorizationFailures = 0;
      let threatDetections = 0;
      let policyViolations = 0;

      if (deps.aiSecurity) {
        const { violations } = await deps.aiSecurity.queries.findViolations({ organizationId });
        authenticationFailures = violations.filter((v) => v.category === 'authentication').length;
        authorizationFailures = violations.filter((v) => v.category === 'authorization').length;
        policyViolations = violations.filter((v) => v.category === 'policy').length;

        const { total } = await deps.aiSecurity.queries.findThreats({ organizationId });
        threatDetections = total;
      }

      const blockedTools = blockedToolCounts.get(organizationId) ?? 0;
      const blockedProviders = blockedProviderCounts.get(organizationId) ?? 0;

      const timestamp = now();
      const snapshot: SecurityAnalyticsSnapshot = {
        id: generateId('security-analytics'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        authenticationFailures,
        authorizationFailures,
        threatDetections,
        blockedTools,
        blockedProviders,
        policyViolations,
        computedAt: timestamp,
      };
      await repository.save(snapshot);
      eventBus?.publish('analytics.snapshot.created', { organizationId, snapshotId: snapshot.id, category: 'security' });
      return snapshot;
    },

    async get(organizationId, snapshotId) {
      return repository.findById(organizationId, snapshotId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
