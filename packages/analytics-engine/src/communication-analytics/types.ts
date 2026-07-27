/** @module communication-analytics/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CommunicationAnalyticsId } from '../shared/identifiers.js';

export type { CommunicationAnalyticsId };

export interface NotificationStatistics {
  readonly total: number;
  readonly sent: number;
  readonly read: number;
}

/** A single, deterministic communication analytics snapshot. */
export interface CommunicationAnalyticsSnapshot extends TenantAuditableEntity<CommunicationAnalyticsId> {
  readonly messageVolume: number;
  readonly averageResponseTimeMinutes: number;
  readonly deliveryRate: number;
  readonly readRate: number;
  readonly notificationStats: NotificationStatistics;
  readonly computedAt: string;
}
