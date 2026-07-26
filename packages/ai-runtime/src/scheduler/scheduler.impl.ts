/**
 * Real {@link Scheduler} implementation — creates/cancels schedules over a
 * {@link ScheduleRepository} and lists due schedules. `ScheduleRepository`
 * only declares `findByAgent` (no organization-wide enumeration), so
 * `listDueSchedules` needs an optional injected listing function — the
 * composition root has the concrete in-memory repository before it's
 * widened to the abstract port, so it can supply one trivially.
 *
 * @module scheduler/scheduler.impl
 */
import { randomUUID } from 'node:crypto';
import type { OrganizationId } from '../shared/identifiers.js';
import type { Schedule } from './types.js';
import type { Scheduler } from './scheduler.js';
import type { ScheduleRepository } from './repository.js';
import type { TaskRepository } from '../task/repository.js';

export interface SchedulerDeps {
  readonly scheduleRepository: ScheduleRepository;
  readonly taskRepository: TaskRepository;
  readonly listAllSchedules?: (organizationId: OrganizationId) => Promise<readonly Schedule[]>;
  /** Injectable clock for deterministic tests. Defaults to the real clock. */
  readonly clock?: () => Date;
}

/** Creates a {@link Scheduler} backed by a {@link ScheduleRepository}. */
export function createScheduler(deps: SchedulerDeps): Scheduler {
  const now = deps.clock ?? (() => new Date());

  return {
    async scheduleTask(organizationId, taskId) {
      const task = await deps.taskRepository.findById(organizationId, taskId);
      if (!task) {
        throw new Error(`Task "${taskId}" not found`);
      }
      const nowIso = now().toISOString();
      const schedule: Schedule = {
        id: randomUUID(),
        organizationId,
        createdAt: nowIso,
        updatedAt: nowIso,
        taskId,
        runtimeAgentId: task.runtimeAgentId,
        trigger: { type: 'manual', nextRunAt: task.scheduledAt ?? nowIso },
        enabled: true,
      };
      await deps.scheduleRepository.save(schedule);
      return schedule;
    },

    async cancelSchedule(organizationId, scheduleId) {
      const schedule = await deps.scheduleRepository.findById(organizationId, scheduleId);
      if (!schedule) return;
      await deps.scheduleRepository.save({ ...schedule, enabled: false, updatedAt: now().toISOString() });
    },

    async listDueSchedules(organizationId, asOf) {
      const all = deps.listAllSchedules ? await deps.listAllSchedules(organizationId) : [];
      return all.filter(
        (schedule) => schedule.enabled && schedule.trigger.nextRunAt !== undefined && schedule.trigger.nextRunAt <= asOf.toISOString(),
      );
    },
  };
}
