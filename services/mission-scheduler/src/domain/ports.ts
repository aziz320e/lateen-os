import type {
  CalendarRule,
  MissionExecutionRecord,
  MissionTrigger,
  MissionTypeDefinition,
  PlatformExecutionResult,
  ScheduleRule,
  ScheduledMission,
  SchedulerDomainEvent,
  SchedulerPolicy,
  MissionSource,
  MissionTypeCode,
  TriggerType,
  QueuePriority,
  ScheduleMode,
} from './types';

export interface MissionRepositoryPort {
  listMissionTypes(): Promise<MissionTypeDefinition[]>;
  listSchedules(organizationId: string): Promise<ScheduleRule[]>;
  saveSchedule(rule: ScheduleRule): Promise<ScheduleRule>;
  listTriggers(organizationId: string): Promise<MissionTrigger[]>;
  saveTrigger(trigger: MissionTrigger): Promise<MissionTrigger>;
  getTrigger(id: string, organizationId: string): Promise<MissionTrigger | null>;
  listCalendarRules(organizationId: string): Promise<CalendarRule[]>;
  saveCalendarRule(rule: CalendarRule): Promise<CalendarRule>;
  listMissions(organizationId: string, status?: ScheduledMission['status']): Promise<ScheduledMission[]>;
  getMission(id: string, organizationId: string): Promise<ScheduledMission | null>;
  saveMission(mission: ScheduledMission): Promise<ScheduledMission>;
  listHistory(missionId: string): Promise<MissionExecutionRecord[]>;
  recordHistory(record: MissionExecutionRecord): Promise<void>;
  listPolicies(organizationId: string): Promise<SchedulerPolicy[]>;
}

export interface MissionQueuePort {
  enqueue(input: {
    missionId: string;
    organizationId: string;
    priority: QueuePriority;
    delayMs?: number;
  }): Promise<{ jobId: string }>;
  retry(missionId: string): Promise<{ jobId: string } | null>;
  listQueued(organizationId: string): Promise<{ missionId: string; status: string; attempts: number }[]>;
}

export interface PlatformExecutorPort {
  execute(mission: ScheduledMission): Promise<PlatformExecutionResult>;
}

export interface SchedulerEventPublisher {
  publish(event: SchedulerDomainEvent): Promise<void>;
  close?(): Promise<void>;
}

export interface CronEvaluatorPort {
  nextRun(cronExpression: string, timezone: string, from?: Date): Date | null;
  isValid(cronExpression: string): boolean;
}

export interface CalendarEvaluatorPort {
  isWithinWorkingHours(rule: CalendarRule, at: Date): boolean;
  nextWorkingSlot(rule: CalendarRule, from: Date): Date;
}

export interface ScheduleInput {
  organizationId: string;
  missionType: MissionTypeCode;
  source: MissionSource;
  mode: ScheduleMode;
  triggerId?: string;
  scheduleId?: string;
  priority?: QueuePriority;
  scheduledAt?: string;
  delaySeconds?: number;
  cronExpression?: string;
  timezone?: string;
  payload?: Record<string, unknown>;
}

export interface TriggerInput {
  organizationId: string;
  type: TriggerType;
  source: MissionSource;
  missionType: MissionTypeCode;
  config?: Record<string, unknown>;
}
