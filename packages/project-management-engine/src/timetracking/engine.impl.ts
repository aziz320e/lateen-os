/**
 * Real Time Tracking engine — immutable work logs, deterministic
 * actual-hours aggregation, utilization against estimated hours, and
 * an overtime flag computed against a standard daily-hours threshold.
 *
 * @module timetracking/engine.impl
 */
import type { ProjectId } from '../project/types.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { ProjectTaskId } from '../task/types.js';
import type { WorkLogRepository } from './repository.js';
import type { WorkLog } from './types.js';

/** A standard 8-hour work day — any single day's logged hours beyond this are flagged as overtime. */
export const STANDARD_WORK_HOURS_PER_DAY = 8;

/** Whether a single day's logged hours exceed the standard work day. */
export function computeIsOvertime(hoursLogged: number, standardHoursPerDay: number = STANDARD_WORK_HOURS_PER_DAY): boolean {
  return hoursLogged > standardHoursPerDay;
}

/** Sums logged hours across a set of work logs. */
export function computeActualHours(logs: readonly WorkLog[]): number {
  return logs.reduce((total, log) => total + log.hoursLogged, 0);
}

/** Percentage of estimated hours actually consumed; `0` when no estimate was set. */
export function computeUtilizationPercentage(actualHours: number, estimatedHours: number | undefined): number {
  if (!estimatedHours || estimatedHours <= 0) return 0;
  return Math.round((actualHours / estimatedHours) * 10000) / 100;
}

export interface LogWorkInput {
  readonly projectId: ProjectId;
  readonly taskId: ProjectTaskId;
  readonly assigneeId: string;
  readonly workDate: ISODate;
  readonly hoursLogged: number;
  readonly notes?: string;
  readonly standardHoursPerDay?: number;
}

export interface TimeTrackingEngine {
  logWork(organizationId: OrganizationId, input: LogWorkInput): Promise<WorkLog>;
  get(organizationId: OrganizationId, workLogId: string): Promise<WorkLog | null>;
  list(organizationId: OrganizationId): Promise<readonly WorkLog[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly WorkLog[]>;
  findByTask(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<readonly WorkLog[]>;
  findByAssignee(organizationId: OrganizationId, assigneeId: string): Promise<readonly WorkLog[]>;
  /** Total logged hours for a task. */
  getActualHoursForTask(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<number>;
  /** Percentage of `estimatedHours` consumed by logged hours for a task. */
  getTaskUtilization(organizationId: OrganizationId, taskId: ProjectTaskId, estimatedHours: number | undefined): Promise<number>;
}

/** Creates a real {@link TimeTrackingEngine}. */
export function createTimeTrackingEngine(repository: WorkLogRepository, now: () => string = nowIso): TimeTrackingEngine {
  return {
    async logWork(organizationId, input) {
      const timestamp = now();
      const log: WorkLog = {
        id: generateId('work-log'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: input.projectId,
        taskId: input.taskId,
        assigneeId: input.assigneeId,
        workDate: input.workDate,
        hoursLogged: input.hoursLogged,
        isOvertime: computeIsOvertime(input.hoursLogged, input.standardHoursPerDay),
        notes: input.notes,
      };
      await repository.save(log);
      return log;
    },

    async get(organizationId, workLogId) {
      return repository.findById(organizationId, workLogId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByProject(organizationId, projectId) {
      return repository.findByProject(organizationId, projectId);
    },

    async findByTask(organizationId, taskId) {
      return repository.findByTask(organizationId, taskId);
    },

    async findByAssignee(organizationId, assigneeId) {
      return repository.findByAssignee(organizationId, assigneeId);
    },

    async getActualHoursForTask(organizationId, taskId) {
      const logs = await repository.findByTask(organizationId, taskId);
      return computeActualHours(logs);
    },

    async getTaskUtilization(organizationId, taskId, estimatedHours) {
      const logs = await repository.findByTask(organizationId, taskId);
      return computeUtilizationPercentage(computeActualHours(logs), estimatedHours);
    },
  };
}
