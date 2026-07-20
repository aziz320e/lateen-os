/** Mission Scheduler domain types — scheduling contracts only, no business logic. */

export type MissionTypeCode =
  | 'LAUNCH_PRODUCT'
  | 'MARKET_RESEARCH'
  | 'COMPETITOR_REVIEW'
  | 'PRICE_OPTIMIZATION'
  | 'CUSTOMER_FOLLOW_UP'
  | 'SALES_PIPELINE_REVIEW'
  | 'PRODUCTION_OPTIMIZATION'
  | 'INVENTORY_REVIEW'
  | 'EXECUTIVE_REPORT'
  | 'FINANCIAL_REVIEW'
  | 'COMPLIANCE_AUDIT';

export type MissionSource =
  | 'BUSINESS_EVENT'
  | 'WORKFLOW_EVENT'
  | 'DECISION_EVENT'
  | 'INTELLIGENCE_SIGNAL'
  | 'INSTITUTIONAL_MEMORY'
  | 'CALENDAR_TRIGGER'
  | 'CRON_SCHEDULE'
  | 'CONNECTOR_WEBHOOK'
  | 'SYSTEM_HEALTH'
  | 'MANUAL';

export type TriggerType =
  | 'MANUAL'
  | 'CRON'
  | 'BUSINESS_EVENT'
  | 'WEBHOOK'
  | 'DECISION_APPROVED'
  | 'WORKFLOW_COMPLETED'
  | 'CONNECTOR_SYNC'
  | 'THRESHOLD_EXCEEDED';

export type ScheduleMode = 'IMMEDIATE' | 'DELAYED' | 'CRON' | 'RECURRING' | 'BUSINESS_CALENDAR';

export type ScheduledMissionStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETRYING'
  | 'DEAD_LETTER'
  | 'EXPIRED';

export type QueuePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface MissionTypeDefinition {
  readonly id: string;
  readonly code: MissionTypeCode;
  readonly name: string;
  readonly description: string;
  readonly targetService: string;
}

export interface ScheduleRule {
  readonly id: string;
  readonly organizationId: string;
  readonly missionType: MissionTypeCode;
  readonly mode: ScheduleMode;
  readonly cronExpression?: string;
  readonly delaySeconds?: number;
  readonly timezone: string;
  readonly workingHoursOnly: boolean;
  readonly enabled: boolean;
  readonly priority: QueuePriority;
  readonly policyRef?: string;
}

export interface MissionTrigger {
  readonly id: string;
  readonly organizationId: string;
  readonly type: TriggerType;
  readonly source: MissionSource;
  readonly missionType: MissionTypeCode;
  readonly config: Record<string, unknown>;
  readonly enabled: boolean;
  readonly lastFiredAt?: string;
}

export interface CalendarRule {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly timezone: string;
  readonly workingDays: readonly number[];
  readonly startHour: number;
  readonly endHour: number;
  readonly holidays: readonly string[];
  readonly enabled: boolean;
}

export interface ScheduledMission {
  readonly id: string;
  readonly organizationId: string;
  readonly missionType: MissionTypeCode;
  readonly status: ScheduledMissionStatus;
  readonly source: MissionSource;
  readonly triggerId?: string;
  readonly scheduleId?: string;
  readonly priority: QueuePriority;
  readonly scheduledAt: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly expiresAt?: string;
  readonly slaDeadlineAt?: string;
  readonly externalMissionId?: string;
  readonly errorMessage?: string;
  readonly attempts: number;
  readonly payload: Record<string, unknown>;
}

export interface MissionExecutionRecord {
  readonly id: string;
  readonly missionId: string;
  readonly status: ScheduledMissionStatus;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly latencyMs?: number;
  readonly errorMessage?: string;
  readonly traceId?: string;
}

export interface SchedulerPolicy {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly rules: Record<string, unknown>;
  readonly enabled: boolean;
}

export type SchedulerEventName =
  | 'MissionScheduled'
  | 'MissionTriggered'
  | 'MissionCancelled'
  | 'MissionRetried'
  | 'MissionFailed'
  | 'MissionExpired';

export interface SchedulerDomainEvent {
  readonly eventId: string;
  readonly eventName: SchedulerEventName;
  readonly organizationId: string;
  readonly occurredAt: string;
  readonly payload: Record<string, unknown>;
}

export interface MonitoringSnapshot {
  readonly upcoming: readonly ScheduledMission[];
  readonly running: readonly ScheduledMission[];
  readonly failed: readonly ScheduledMission[];
  readonly retryQueueLength: number;
  readonly averageExecutionMs: number;
  readonly slaBreaches: number;
}

export interface PlatformExecutionResult {
  readonly ok: boolean;
  readonly externalMissionId?: string;
  readonly message: string;
}
