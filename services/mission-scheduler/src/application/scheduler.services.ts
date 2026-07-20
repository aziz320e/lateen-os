import { randomUUID } from 'node:crypto';
import type { AppConfig } from '../config/index';
import type {
  CalendarEvaluatorPort,
  CronEvaluatorPort,
  MissionQueuePort,
  MissionRepositoryPort,
  PlatformExecutorPort,
  ScheduleInput,
  SchedulerEventPublisher,
  TriggerInput,
} from '../domain/ports';
import type {
  CalendarRule,
  MissionTrigger,
  ScheduleRule,
  ScheduledMission,
  SchedulerDomainEvent,
  SchedulerEventName,
} from '../domain/types';
import { getMissionType } from '../mission/catalog';

export class ScheduleService {
  constructor(
    private readonly repo: MissionRepositoryPort,
    private readonly cron: CronEvaluatorPort,
    private readonly calendar: CalendarEvaluatorPort,
    private readonly scheduler: MissionSchedulerService,
  ) {}

  listSchedules(organizationId: string) {
    return this.repo.listSchedules(organizationId);
  }

  async createSchedule(input: Omit<ScheduleRule, 'id'> & { id?: string }): Promise<ScheduleRule> {
    if (input.cronExpression && !this.cron.isValid(input.cronExpression)) {
      throw new Error('Invalid cron expression');
    }
    const rule: ScheduleRule = { ...input, id: input.id ?? randomUUID() };
    return this.repo.saveSchedule(rule);
  }

  async materializeFromSchedule(rule: ScheduleRule): Promise<ScheduledMission> {
    let scheduledAt = new Date();

    if (rule.mode === 'DELAYED' && rule.delaySeconds) {
      scheduledAt = new Date(Date.now() + rule.delaySeconds * 1000);
    } else if ((rule.mode === 'CRON' || rule.mode === 'RECURRING') && rule.cronExpression) {
      const next = this.cron.nextRun(rule.cronExpression, rule.timezone);
      if (!next) throw new Error('Could not compute next cron run');
      scheduledAt = next;
    }

    if (rule.workingHoursOnly) {
      const calendars = await this.repo.listCalendarRules(rule.organizationId);
      const cal = calendars.find((c) => c.enabled) ?? defaultCalendar(rule.organizationId);
      if (!this.calendar.isWithinWorkingHours(cal, scheduledAt)) {
        scheduledAt = this.calendar.nextWorkingSlot(cal, scheduledAt);
      }
    }

    return this.scheduler.scheduleMission({
      organizationId: rule.organizationId,
      missionType: rule.missionType,
      source: 'CRON_SCHEDULE',
      mode: rule.mode,
      scheduleId: rule.id,
      priority: rule.priority,
      scheduledAt: scheduledAt.toISOString(),
    });
  }
}

export class TriggerService {
  constructor(
    private readonly repo: MissionRepositoryPort,
    private readonly scheduler: MissionSchedulerService,
  ) {}

  listTriggers(organizationId: string) {
    return this.repo.listTriggers(organizationId);
  }

  async registerTrigger(input: TriggerInput & { id?: string }): Promise<MissionTrigger> {
    if (!getMissionType(input.missionType)) throw new Error(`Unknown mission type: ${input.missionType}`);
    const trigger: MissionTrigger = {
      id: input.id ?? randomUUID(),
      organizationId: input.organizationId,
      type: input.type,
      source: input.source,
      missionType: input.missionType,
      config: input.config ?? {},
      enabled: true,
    };
    return this.repo.saveTrigger(trigger);
  }

  async fireTrigger(triggerId: string, organizationId: string, payload?: Record<string, unknown>) {
    const trigger = await this.repo.getTrigger(triggerId, organizationId);
    if (!trigger || !trigger.enabled) throw new Error('Trigger not found or disabled');

    const mission = await this.scheduler.scheduleMission({
      organizationId,
      missionType: trigger.missionType,
      source: trigger.source,
      mode: 'IMMEDIATE',
      triggerId: trigger.id,
      priority: 'NORMAL',
      payload: { ...trigger.config, ...payload },
    });

    await this.repo.saveTrigger({ ...trigger, lastFiredAt: new Date().toISOString() });
    return mission;
  }
}

export class CalendarService {
  constructor(private readonly repo: MissionRepositoryPort) {}

  listRules(organizationId: string) {
    return this.repo.listCalendarRules(organizationId);
  }

  saveRule(input: Omit<CalendarRule, 'id'> & { id?: string }) {
    const rule: CalendarRule = { ...input, id: input.id ?? randomUUID() };
    return this.repo.saveCalendarRule(rule);
  }
}

export class PolicyService {
  constructor(private readonly repo: MissionRepositoryPort) {}

  listPolicies(organizationId: string) {
    return this.repo.listPolicies(organizationId);
  }
}

export class MissionSchedulerService {
  constructor(
    private readonly repo: MissionRepositoryPort,
    private readonly queue: MissionQueuePort,
    private readonly events: SchedulerEventPublisher,
    private readonly config: AppConfig,
  ) {}

  async scheduleMission(input: ScheduleInput): Promise<ScheduledMission> {
    if (!getMissionType(input.missionType)) throw new Error(`Unknown mission type: ${input.missionType}`);

    const now = new Date();
    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : now;
    const slaDeadline = new Date(scheduledAt.getTime() + this.config.DEFAULT_SLA_MINUTES * 60_000);

    const mission: ScheduledMission = {
      id: randomUUID(),
      organizationId: input.organizationId,
      missionType: input.missionType,
      status: input.mode === 'IMMEDIATE' ? 'SCHEDULED' : 'PENDING',
      source: input.source,
      triggerId: input.triggerId,
      scheduleId: input.scheduleId,
      priority: input.priority ?? 'NORMAL',
      scheduledAt: scheduledAt.toISOString(),
      slaDeadlineAt: slaDeadline.toISOString(),
      attempts: 0,
      payload: input.payload ?? {},
    };

    const saved = await this.repo.saveMission(mission);
    await this.publish('MissionScheduled', input.organizationId, { missionId: saved.id, missionType: saved.missionType });

    const delayMs = Math.max(0, scheduledAt.getTime() - now.getTime());
    await this.queue.enqueue({ missionId: saved.id, organizationId: input.organizationId, priority: saved.priority, delayMs });

    return saved;
  }

  async cancelMission(id: string, organizationId: string): Promise<ScheduledMission> {
    const mission = await this.requireMission(id, organizationId);
    const updated = await this.repo.saveMission({ ...mission, status: 'CANCELLED' });
    await this.publish('MissionCancelled', organizationId, { missionId: id });
    return updated;
  }

  async retryMission(id: string, organizationId: string): Promise<ScheduledMission> {
    const mission = await this.requireMission(id, organizationId);
    if (mission.attempts >= this.config.MAX_RETRY_ATTEMPTS) {
      const dead = await this.repo.saveMission({ ...mission, status: 'DEAD_LETTER' });
      await this.publish('MissionFailed', organizationId, { missionId: id, reason: 'max retries' });
      return dead;
    }
    const updated = await this.repo.saveMission({
      ...mission,
      status: 'RETRYING',
      attempts: mission.attempts + 1,
    });
    await this.queue.retry(id);
    await this.publish('MissionRetried', organizationId, { missionId: id, attempt: updated.attempts });
    return updated;
  }

  listMissions(organizationId: string, status?: ScheduledMission['status']) {
    return this.repo.listMissions(organizationId, status);
  }

  getMission(id: string, organizationId: string) {
    return this.repo.getMission(id, organizationId);
  }

  private async requireMission(id: string, organizationId: string): Promise<ScheduledMission> {
    const m = await this.repo.getMission(id, organizationId);
    if (!m) throw new Error('Mission not found');
    return m;
  }

  private async publish(name: SchedulerEventName, organizationId: string, payload: Record<string, unknown>) {
    const event: SchedulerDomainEvent = {
      eventId: randomUUID(),
      eventName: name,
      organizationId,
      occurredAt: new Date().toISOString(),
      payload,
    };
    await this.events.publish(event);
  }
}

export class ExecutionService {
  constructor(
    private readonly repo: MissionRepositoryPort,
    private readonly executor: PlatformExecutorPort,
    private readonly events: SchedulerEventPublisher,
    private readonly config: AppConfig,
  ) {}

  async executeMission(id: string, organizationId: string): Promise<ScheduledMission> {
    const mission = await this.repo.getMission(id, organizationId);
    if (!mission) throw new Error('Mission not found');

    if (mission.expiresAt && new Date(mission.expiresAt) < new Date()) {
      const expired = await this.repo.saveMission({ ...mission, status: 'EXPIRED' });
      await this.events.publish({
        eventId: randomUUID(),
        eventName: 'MissionExpired',
        organizationId,
        occurredAt: new Date().toISOString(),
        payload: { missionId: id },
      });
      return expired;
    }

    const start = Date.now();
    const running = await this.repo.saveMission({ ...mission, status: 'RUNNING', startedAt: new Date().toISOString() });

    await this.events.publish({
      eventId: randomUUID(),
      eventName: 'MissionTriggered',
      organizationId,
      occurredAt: new Date().toISOString(),
      payload: { missionId: id, missionType: mission.missionType },
    });

    const traceId = randomUUID();
    const result = await this.executor.execute(running);
    const latencyMs = Date.now() - start;

    const finalStatus = result.ok ? 'COMPLETED' : 'FAILED';
    const completed = await this.repo.saveMission({
      ...running,
      status: finalStatus,
      completedAt: new Date().toISOString(),
      externalMissionId: result.externalMissionId,
      errorMessage: result.ok ? undefined : result.message,
    });

    await this.repo.recordHistory({
      id: randomUUID(),
      missionId: id,
      status: finalStatus,
      startedAt: running.startedAt!,
      completedAt: completed.completedAt,
      latencyMs,
      errorMessage: result.ok ? undefined : result.message,
      traceId,
    });

    if (!result.ok) {
      await this.events.publish({
        eventId: randomUUID(),
        eventName: 'MissionFailed',
        organizationId,
        occurredAt: new Date().toISOString(),
        payload: { missionId: id, error: result.message },
      });
    }

    return completed;
  }
}

export class MonitoringService {
  constructor(
    private readonly repo: MissionRepositoryPort,
    private readonly queue: MissionQueuePort,
  ) {}

  async getSnapshot(organizationId: string) {
    const [all, queued] = await Promise.all([
      this.repo.listMissions(organizationId),
      this.queue.listQueued(organizationId),
    ]);

    const now = Date.now();
    const upcoming = all.filter((m) => m.status === 'PENDING' || m.status === 'SCHEDULED');
    const running = all.filter((m) => m.status === 'RUNNING');
    const failed = all.filter((m) => m.status === 'FAILED' || m.status === 'DEAD_LETTER');

    const histories = await Promise.all(
      all.filter((m) => m.status === 'COMPLETED').slice(0, 20).map((m) => this.repo.listHistory(m.id)),
    );
    const latencies = histories.flat().map((h) => h.latencyMs ?? 0).filter((n) => n > 0);
    const averageExecutionMs = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

    const slaBreaches = all.filter(
      (m) => m.slaDeadlineAt && new Date(m.slaDeadlineAt).getTime() < now && m.status !== 'COMPLETED' && m.status !== 'CANCELLED',
    ).length;

    return {
      upcoming,
      running,
      failed,
      retryQueueLength: queued.filter((q) => q.attempts > 0).length,
      averageExecutionMs,
      slaBreaches,
    };
  }
}

export class HistoryService {
  constructor(private readonly repo: MissionRepositoryPort) {}

  listHistory(organizationId: string, missionId?: string) {
    if (missionId) return this.repo.listHistory(missionId);
    return this.repo.listMissions(organizationId).then(async (missions) => {
      const all = await Promise.all(missions.map((m) => this.repo.listHistory(m.id)));
      return all.flat().sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    });
  }
}

function defaultCalendar(organizationId: string): CalendarRule {
  return {
    id: 'default',
    organizationId,
    name: 'Default Business Calendar',
    timezone: 'Asia/Riyadh',
    workingDays: [0, 1, 2, 3, 4],
    startHour: 8,
    endHour: 17,
    holidays: [],
    enabled: true,
  };
}
