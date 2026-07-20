import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/mission-scheduler-client';
import { MISSION_TYPE_CATALOG, getMissionType } from '../mission/catalog';
import type {
  CalendarRule,
  MissionExecutionRecord,
  MissionTrigger,
  MissionTypeDefinition,
  ScheduleRule,
  ScheduledMission,
  SchedulerPolicy,
} from '../domain/types';
import type { MissionRepositoryPort } from '../domain/ports';

function mapMission(row: {
  id: string;
  organizationId: string;
  missionType: string;
  status: string;
  source: string;
  triggerId: string | null;
  scheduleId: string | null;
  priority: string;
  scheduledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date | null;
  slaDeadlineAt: Date | null;
  externalMissionId: string | null;
  errorMessage: string | null;
  attempts: number;
  payload: unknown;
}): ScheduledMission {
  return {
    id: row.id,
    organizationId: row.organizationId,
    missionType: row.missionType as ScheduledMission['missionType'],
    status: row.status as ScheduledMission['status'],
    source: row.source as ScheduledMission['source'],
    triggerId: row.triggerId ?? undefined,
    scheduleId: row.scheduleId ?? undefined,
    priority: row.priority as ScheduledMission['priority'],
    scheduledAt: row.scheduledAt.toISOString(),
    startedAt: row.startedAt?.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    expiresAt: row.expiresAt?.toISOString(),
    slaDeadlineAt: row.slaDeadlineAt?.toISOString(),
    externalMissionId: row.externalMissionId ?? undefined,
    errorMessage: row.errorMessage ?? undefined,
    attempts: row.attempts,
    payload: (row.payload as Record<string, unknown>) ?? {},
  };
}

export class PrismaMissionRepository implements MissionRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  listMissionTypes(): Promise<MissionTypeDefinition[]> {
    return Promise.resolve(MISSION_TYPE_CATALOG);
  }

  async listSchedules(organizationId: string): Promise<ScheduleRule[]> {
    const rows = await this.prisma.scheduleRule.findMany({ where: { organizationId } });
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      missionType: r.missionType as ScheduleRule['missionType'],
      mode: r.mode as ScheduleRule['mode'],
      cronExpression: r.cronExpression ?? undefined,
      delaySeconds: r.delaySeconds ?? undefined,
      timezone: r.timezone,
      workingHoursOnly: r.workingHoursOnly,
      enabled: r.enabled,
      priority: r.priority as ScheduleRule['priority'],
      policyRef: r.policyRef ?? undefined,
    }));
  }

  async saveSchedule(rule: ScheduleRule): Promise<ScheduleRule> {
    const row = await this.prisma.scheduleRule.upsert({
      where: { id: rule.id },
      create: {
        id: rule.id,
        organizationId: rule.organizationId,
        missionType: rule.missionType,
        mode: rule.mode,
        cronExpression: rule.cronExpression,
        delaySeconds: rule.delaySeconds,
        timezone: rule.timezone,
        workingHoursOnly: rule.workingHoursOnly,
        enabled: rule.enabled,
        priority: rule.priority,
        policyRef: rule.policyRef,
      },
      update: {
        missionType: rule.missionType,
        mode: rule.mode,
        cronExpression: rule.cronExpression,
        delaySeconds: rule.delaySeconds,
        timezone: rule.timezone,
        workingHoursOnly: rule.workingHoursOnly,
        enabled: rule.enabled,
        priority: rule.priority,
        policyRef: rule.policyRef,
      },
    });
    return {
      id: row.id,
      organizationId: row.organizationId,
      missionType: row.missionType as ScheduleRule['missionType'],
      mode: row.mode as ScheduleRule['mode'],
      cronExpression: row.cronExpression ?? undefined,
      delaySeconds: row.delaySeconds ?? undefined,
      timezone: row.timezone,
      workingHoursOnly: row.workingHoursOnly,
      enabled: row.enabled,
      priority: row.priority as ScheduleRule['priority'],
      policyRef: row.policyRef ?? undefined,
    };
  }

  async listTriggers(organizationId: string): Promise<MissionTrigger[]> {
    const rows = await this.prisma.missionTrigger.findMany({ where: { organizationId } });
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      type: r.type as MissionTrigger['type'],
      source: r.source as MissionTrigger['source'],
      missionType: r.missionType as MissionTrigger['missionType'],
      config: (r.config as Record<string, unknown>) ?? {},
      enabled: r.enabled,
      lastFiredAt: r.lastFiredAt?.toISOString(),
    }));
  }

  async saveTrigger(trigger: MissionTrigger): Promise<MissionTrigger> {
    const row = await this.prisma.missionTrigger.upsert({
      where: { id: trigger.id },
      create: {
        id: trigger.id,
        organizationId: trigger.organizationId,
        type: trigger.type,
        source: trigger.source,
        missionType: trigger.missionType,
        config: trigger.config as object,
        enabled: trigger.enabled,
        lastFiredAt: trigger.lastFiredAt ? new Date(trigger.lastFiredAt) : undefined,
      },
      update: {
        type: trigger.type,
        source: trigger.source,
        missionType: trigger.missionType,
        config: trigger.config as object,
        enabled: trigger.enabled,
        lastFiredAt: trigger.lastFiredAt ? new Date(trigger.lastFiredAt) : undefined,
      },
    });
    return {
      id: row.id,
      organizationId: row.organizationId,
      type: row.type as MissionTrigger['type'],
      source: row.source as MissionTrigger['source'],
      missionType: row.missionType as MissionTrigger['missionType'],
      config: (row.config as Record<string, unknown>) ?? {},
      enabled: row.enabled,
      lastFiredAt: row.lastFiredAt?.toISOString(),
    };
  }

  async getTrigger(id: string, organizationId: string): Promise<MissionTrigger | null> {
    const row = await this.prisma.missionTrigger.findFirst({ where: { id, organizationId } });
    if (!row) return null;
    return {
      id: row.id,
      organizationId: row.organizationId,
      type: row.type as MissionTrigger['type'],
      source: row.source as MissionTrigger['source'],
      missionType: row.missionType as MissionTrigger['missionType'],
      config: (row.config as Record<string, unknown>) ?? {},
      enabled: row.enabled,
      lastFiredAt: row.lastFiredAt?.toISOString(),
    };
  }

  async listCalendarRules(organizationId: string): Promise<CalendarRule[]> {
    const rows = await this.prisma.calendarRule.findMany({ where: { organizationId } });
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      name: r.name,
      timezone: r.timezone,
      workingDays: r.workingDays,
      startHour: r.startHour,
      endHour: r.endHour,
      holidays: (r.holidays as string[]) ?? [],
      enabled: r.enabled,
    }));
  }

  async saveCalendarRule(rule: CalendarRule): Promise<CalendarRule> {
    const row = await this.prisma.calendarRule.upsert({
      where: { id: rule.id },
      create: {
        id: rule.id,
        organizationId: rule.organizationId,
        name: rule.name,
        timezone: rule.timezone,
        workingDays: [...rule.workingDays],
        startHour: rule.startHour,
        endHour: rule.endHour,
        holidays: [...rule.holidays],
        enabled: rule.enabled,
      },
      update: {
        name: rule.name,
        timezone: rule.timezone,
        workingDays: [...rule.workingDays],
        startHour: rule.startHour,
        endHour: rule.endHour,
        holidays: [...rule.holidays],
        enabled: rule.enabled,
      },
    });
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      timezone: row.timezone,
      workingDays: row.workingDays,
      startHour: row.startHour,
      endHour: row.endHour,
      holidays: (row.holidays as string[]) ?? [],
      enabled: row.enabled,
    };
  }

  async listMissions(organizationId: string, status?: ScheduledMission['status']): Promise<ScheduledMission[]> {
    const rows = await this.prisma.scheduledMission.findMany({
      where: { organizationId, ...(status ? { status } : {}) },
      orderBy: { scheduledAt: 'asc' },
    });
    return rows.map(mapMission);
  }

  async getMission(id: string, organizationId: string): Promise<ScheduledMission | null> {
    const row = await this.prisma.scheduledMission.findFirst({ where: { id, organizationId } });
    return row ? mapMission(row) : null;
  }

  async saveMission(mission: ScheduledMission): Promise<ScheduledMission> {
    const row = await this.prisma.scheduledMission.upsert({
      where: { id: mission.id },
      create: {
        id: mission.id,
        organizationId: mission.organizationId,
        missionType: mission.missionType,
        status: mission.status,
        source: mission.source,
        triggerId: mission.triggerId,
        scheduleId: mission.scheduleId,
        priority: mission.priority,
        scheduledAt: new Date(mission.scheduledAt),
        startedAt: mission.startedAt ? new Date(mission.startedAt) : undefined,
        completedAt: mission.completedAt ? new Date(mission.completedAt) : undefined,
        expiresAt: mission.expiresAt ? new Date(mission.expiresAt) : undefined,
        slaDeadlineAt: mission.slaDeadlineAt ? new Date(mission.slaDeadlineAt) : undefined,
        externalMissionId: mission.externalMissionId,
        errorMessage: mission.errorMessage,
        attempts: mission.attempts,
        payload: mission.payload as object,
      },
      update: {
        status: mission.status,
        startedAt: mission.startedAt ? new Date(mission.startedAt) : undefined,
        completedAt: mission.completedAt ? new Date(mission.completedAt) : undefined,
        externalMissionId: mission.externalMissionId,
        errorMessage: mission.errorMessage,
        attempts: mission.attempts,
        payload: mission.payload as object,
      },
    });
    return mapMission(row);
  }

  async listHistory(missionId: string): Promise<MissionExecutionRecord[]> {
    const rows = await this.prisma.missionExecutionHistory.findMany({ where: { missionId }, orderBy: { startedAt: 'desc' } });
    return rows.map((r) => ({
      id: r.id,
      missionId: r.missionId,
      status: r.status as MissionExecutionRecord['status'],
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt?.toISOString(),
      latencyMs: r.latencyMs ?? undefined,
      errorMessage: r.errorMessage ?? undefined,
      traceId: r.traceId ?? undefined,
    }));
  }

  async recordHistory(record: MissionExecutionRecord): Promise<void> {
    await this.prisma.missionExecutionHistory.create({
      data: {
        id: record.id,
        missionId: record.missionId,
        status: record.status,
        startedAt: new Date(record.startedAt),
        completedAt: record.completedAt ? new Date(record.completedAt) : undefined,
        latencyMs: record.latencyMs,
        errorMessage: record.errorMessage,
        traceId: record.traceId,
      },
    });
  }

  async listPolicies(organizationId: string): Promise<SchedulerPolicy[]> {
    const rows = await this.prisma.schedulerPolicy.findMany({ where: { organizationId } });
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      name: r.name,
      rules: (r.rules as Record<string, unknown>) ?? {},
      enabled: r.enabled,
    }));
  }
}

export class InMemoryMissionRepository implements MissionRepositoryPort {
  private schedules = new Map<string, ScheduleRule>();
  private triggers = new Map<string, MissionTrigger>();
  private calendars = new Map<string, CalendarRule>();
  private missions = new Map<string, ScheduledMission>();
  private history = new Map<string, MissionExecutionRecord[]>();
  private policies = new Map<string, SchedulerPolicy>();

  listMissionTypes() {
    return Promise.resolve(MISSION_TYPE_CATALOG);
  }

  listSchedules(organizationId: string) {
    return Promise.resolve([...this.schedules.values()].filter((s) => s.organizationId === organizationId));
  }

  saveSchedule(rule: ScheduleRule) {
    this.schedules.set(rule.id, rule);
    return Promise.resolve(rule);
  }

  listTriggers(organizationId: string) {
    return Promise.resolve([...this.triggers.values()].filter((t) => t.organizationId === organizationId));
  }

  saveTrigger(trigger: MissionTrigger) {
    this.triggers.set(trigger.id, trigger);
    return Promise.resolve(trigger);
  }

  getTrigger(id: string, organizationId: string) {
    const t = this.triggers.get(id);
    return Promise.resolve(t && t.organizationId === organizationId ? t : null);
  }

  listCalendarRules(organizationId: string) {
    return Promise.resolve([...this.calendars.values()].filter((c) => c.organizationId === organizationId));
  }

  saveCalendarRule(rule: CalendarRule) {
    this.calendars.set(rule.id, rule);
    return Promise.resolve(rule);
  }

  listMissions(organizationId: string, status?: ScheduledMission['status']) {
    return Promise.resolve(
      [...this.missions.values()].filter(
        (m) => m.organizationId === organizationId && (!status || m.status === status),
      ),
    );
  }

  getMission(id: string, organizationId: string) {
    const m = this.missions.get(id);
    return Promise.resolve(m && m.organizationId === organizationId ? m : null);
  }

  saveMission(mission: ScheduledMission) {
    this.missions.set(mission.id, mission);
    return Promise.resolve(mission);
  }

  listHistory(missionId: string) {
    return Promise.resolve(this.history.get(missionId) ?? []);
  }

  recordHistory(record: MissionExecutionRecord) {
    const list = this.history.get(record.missionId) ?? [];
    list.unshift(record);
    this.history.set(record.missionId, list);
    return Promise.resolve();
  }

  listPolicies(organizationId: string) {
    return Promise.resolve([...this.policies.values()].filter((p) => p.organizationId === organizationId));
  }
}

export function createRepositories(prisma: PrismaClient): MissionRepositoryPort {
  return new PrismaMissionRepository(prisma);
}

export function createInMemoryRepository(): MissionRepositoryPort {
  return new InMemoryMissionRepository();
}

export { getMissionType };
