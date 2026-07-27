/**
 * Real Communication Analytics engine — message volume, response
 * time, delivery rate, read rate, and notification statistics.
 * Composes the real, optional Communication Hub query port (never a
 * repository).
 *
 * @module communication-analytics/engine.impl
 */
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CommunicationAnalyticsId, OrganizationId } from '../shared/identifiers.js';
import type { CommunicationAnalyticsRepository } from './repository.js';
import type { CommunicationAnalyticsSnapshot, NotificationStatistics } from './types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Pure: average minutes between consecutive, chronologically-sorted `sentAt` timestamps within each conversation. */
export function computeAverageResponseTimeMinutes(messagesByConversation: Readonly<Record<string, readonly { readonly sentAt?: string }[]>>): number {
  const deltasMinutes: number[] = [];
  for (const messages of Object.values(messagesByConversation)) {
    const sentTimestamps = messages
      .map((message) => message.sentAt)
      .filter((sentAt): sentAt is string => sentAt !== undefined)
      .sort();
    for (let i = 1; i < sentTimestamps.length; i += 1) {
      deltasMinutes.push((new Date(sentTimestamps[i]!).getTime() - new Date(sentTimestamps[i - 1]!).getTime()) / 60_000);
    }
  }
  if (deltasMinutes.length === 0) return 0;
  return round2(deltasMinutes.reduce((sum, value) => sum + value, 0) / deltasMinutes.length);
}

/** Pure: percentage of dispatched (non-draft, non-queued) messages reaching at least `delivered`. */
export function computeDeliveryRate(dispatchedCount: number, deliveredOrReadCount: number): number {
  return dispatchedCount === 0 ? 0 : round2((deliveredOrReadCount / dispatchedCount) * 100);
}

/** Pure: percentage of dispatched messages that were read. */
export function computeReadRate(dispatchedCount: number, readCount: number): number {
  return dispatchedCount === 0 ? 0 : round2((readCount / dispatchedCount) * 100);
}

export interface CommunicationAnalyticsDeps {
  readonly communicationHub?: Pick<CommunicationRuntime, 'queries'>;
}

export interface CommunicationAnalyticsEngine {
  computeSnapshot(organizationId: OrganizationId): Promise<CommunicationAnalyticsSnapshot>;
  get(organizationId: OrganizationId, snapshotId: CommunicationAnalyticsId): Promise<CommunicationAnalyticsSnapshot | null>;
  list(organizationId: OrganizationId): Promise<readonly CommunicationAnalyticsSnapshot[]>;
}

const DISPATCHED_STATUSES = new Set(['sent', 'delivered', 'read', 'failed']);

/** Creates a real {@link CommunicationAnalyticsEngine} over the optional Communication Hub collaborator. */
export function createCommunicationAnalyticsEngine(
  repository: CommunicationAnalyticsRepository,
  deps: CommunicationAnalyticsDeps = {},
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): CommunicationAnalyticsEngine {
  return {
    async computeSnapshot(organizationId) {
      let messageVolume = 0;
      let averageResponseTimeMinutes = 0;
      let deliveryRate = 0;
      let readRate = 0;
      let notificationStats: NotificationStatistics = { total: 0, sent: 0, read: 0 };

      if (deps.communicationHub) {
        const { messages } = await deps.communicationHub.queries.findMessages({ organizationId });
        messageVolume = messages.length;

        const messagesByConversation: Record<string, { sentAt?: string }[]> = {};
        for (const message of messages) {
          (messagesByConversation[message.conversationId] ??= []).push({ sentAt: message.sentAt });
        }
        averageResponseTimeMinutes = computeAverageResponseTimeMinutes(messagesByConversation);

        const dispatched = messages.filter((message) => DISPATCHED_STATUSES.has(message.status));
        const deliveredOrRead = dispatched.filter((message) => message.status === 'delivered' || message.status === 'read');
        const read = dispatched.filter((message) => message.status === 'read');
        deliveryRate = computeDeliveryRate(dispatched.length, deliveredOrRead.length);
        readRate = computeReadRate(dispatched.length, read.length);

        const { notifications } = await deps.communicationHub.queries.findNotifications({ organizationId });
        notificationStats = {
          total: notifications.length,
          sent: notifications.filter((n) => n.status !== 'pending' && n.status !== 'cancelled').length,
          read: notifications.filter((n) => n.status === 'read').length,
        };
      }

      const timestamp = now();
      const snapshot: CommunicationAnalyticsSnapshot = {
        id: generateId('communication-analytics'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        messageVolume,
        averageResponseTimeMinutes,
        deliveryRate,
        readRate,
        notificationStats,
        computedAt: timestamp,
      };
      await repository.save(snapshot);
      eventBus?.publish('analytics.snapshot.created', { organizationId, snapshotId: snapshot.id, category: 'communication' });
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
