/**
 * Real Customer Health engine — a deterministic health score computed
 * from six caller-supplied component scores (usage, communication,
 * projects, payment status, engagement, renewals). **No model-based
 * prediction anywhere** — `computeHealthScore()` is a fixed,
 * equally-weighted average, and `computeHealthTier()` is a fixed
 * banding function.
 *
 * @module health/engine.impl
 */
import type { CustomerSuccessEventBus } from '../events/customer-success-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { HealthSnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { HealthSnapshotRepository } from './repository.js';
import type { HealthSnapshot, HealthTier } from './types.js';

export interface HealthComponents {
  readonly usageScore: number;
  readonly communicationScore: number;
  readonly projectScore: number;
  readonly paymentScore: number;
  readonly engagementScore: number;
  readonly renewalScore: number;
}

/** Equally-weighted average of the six component scores, rounded to the nearest whole point. */
export function computeHealthScore(components: HealthComponents): number {
  const total =
    components.usageScore +
    components.communicationScore +
    components.projectScore +
    components.paymentScore +
    components.engagementScore +
    components.renewalScore;
  return Math.round(total / 6);
}

/** Fixed banding of an overall health score into a qualitative tier. */
export function computeHealthTier(overallScore: number): HealthTier {
  if (overallScore >= 75) return 'healthy';
  if (overallScore >= 50) return 'neutral';
  if (overallScore >= 25) return 'at_risk';
  return 'critical';
}

export interface RecordHealthSnapshotInput extends HealthComponents {
  readonly customerId: string;
}

export interface CustomerHealthEngine {
  recordSnapshot(organizationId: OrganizationId, input: RecordHealthSnapshotInput): Promise<HealthSnapshot>;
  get(organizationId: OrganizationId, snapshotId: HealthSnapshotId): Promise<HealthSnapshot | null>;
  list(organizationId: OrganizationId): Promise<readonly HealthSnapshot[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly HealthSnapshot[]>;
  getLatest(organizationId: OrganizationId, customerId: string): Promise<HealthSnapshot | null>;
}

/** Creates a real {@link CustomerHealthEngine}. */
export function createCustomerHealthEngine(
  repository: HealthSnapshotRepository,
  eventBus?: CustomerSuccessEventBus,
  now: () => string = nowIso,
): CustomerHealthEngine {
  return {
    async recordSnapshot(organizationId, input) {
      const overallScore = computeHealthScore(input);
      const tier = computeHealthTier(overallScore);
      const timestamp = now();
      const snapshot: HealthSnapshot = {
        id: generateId('health-snapshot'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        customerId: input.customerId,
        usageScore: input.usageScore,
        communicationScore: input.communicationScore,
        projectScore: input.projectScore,
        paymentScore: input.paymentScore,
        engagementScore: input.engagementScore,
        renewalScore: input.renewalScore,
        overallScore,
        tier,
      };
      await repository.save(snapshot);
      eventBus?.publish('customer.health.updated', { organizationId, healthSnapshotId: snapshot.id, customerId: snapshot.customerId, overallScore, tier });
      return snapshot;
    },

    async get(organizationId, snapshotId) {
      return repository.findById(organizationId, snapshotId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByCustomer(organizationId, customerId) {
      return repository.findByCustomer(organizationId, customerId);
    },

    async getLatest(organizationId, customerId) {
      const snapshots = await repository.findByCustomer(organizationId, customerId);
      if (snapshots.length === 0) return null;
      // `>=` (not `>`) so that snapshots recorded within the same millisecond
      // resolve deterministically to the most recently inserted one, rather
      // than an arbitrary tie based on raw timestamp comparison.
      return snapshots.reduce((latest, candidate) => (candidate.createdAt >= latest.createdAt ? candidate : latest));
    },
  };
}
