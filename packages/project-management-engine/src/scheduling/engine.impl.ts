/**
 * Real Scheduling Engine — deterministic Critical Path Method (CPM)
 * over a project's task dependency graph. No AI/heuristic
 * optimization anywhere: forward pass, backward pass, slack, and
 * critical-path flags are all fixed graph arithmetic over
 * caller-supplied task durations and dependencies.
 *
 * @module scheduling/engine.impl
 */
import type { ProjectId } from '../project/types.js';
import { addDaysIso } from '../shared/date.js';
import { ScheduleNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, ScheduleId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { ProjectTaskId } from '../task/types.js';
import type { ScheduleRepository } from './repository.js';
import type { Schedule, ScheduleEntry } from './types.js';

export interface ScheduleTaskInput {
  readonly taskId: ProjectTaskId;
  readonly durationDays: number;
  readonly dependsOnTaskIds: readonly ProjectTaskId[];
}

/**
 * Computes a deterministic CPM schedule: forward pass (early
 * start/finish), backward pass (late start/finish), slack, and the
 * critical path (every task with zero slack). `tasks` must form a
 * DAG — Task Management's own dependency-cycle guard is what
 * prevents a cycle from ever reaching this function.
 */
export function computeCriticalPathSchedule(tasks: readonly ScheduleTaskInput[], projectStartDate: ISODate): readonly ScheduleEntry[] {
  const byId = new Map(tasks.map((task) => [task.taskId, task] as const));
  const successors = new Map<ProjectTaskId, ProjectTaskId[]>();
  for (const task of tasks) {
    for (const dependsOnTaskId of task.dependsOnTaskIds) {
      const list = successors.get(dependsOnTaskId) ?? [];
      list.push(task.taskId);
      successors.set(dependsOnTaskId, list);
    }
  }

  const earlyStart = new Map<ProjectTaskId, number>();
  const earlyFinish = new Map<ProjectTaskId, number>();

  function computeEarly(taskId: ProjectTaskId, visiting: ReadonlySet<ProjectTaskId>): number {
    const cached = earlyFinish.get(taskId);
    if (cached !== undefined) return cached;
    if (visiting.has(taskId)) throw new Error(`Cyclic task dependency detected at "${taskId}" — cannot compute a schedule`);
    const task = byId.get(taskId);
    if (!task) throw new Error(`Unknown task "${taskId}" referenced as a dependency`);

    const nextVisiting = new Set(visiting).add(taskId);
    const start = task.dependsOnTaskIds.length === 0 ? 0 : Math.max(...task.dependsOnTaskIds.map((dep) => computeEarly(dep, nextVisiting)));
    const finish = start + task.durationDays;
    earlyStart.set(taskId, start);
    earlyFinish.set(taskId, finish);
    return finish;
  }

  for (const task of tasks) {
    computeEarly(task.taskId, new Set());
  }

  const projectDuration = tasks.length === 0 ? 0 : Math.max(...tasks.map((task) => earlyFinish.get(task.taskId) ?? 0));

  const lateFinish = new Map<ProjectTaskId, number>();
  const lateStart = new Map<ProjectTaskId, number>();

  function computeLate(taskId: ProjectTaskId): number {
    const cached = lateStart.get(taskId);
    if (cached !== undefined) return cached;
    const task = byId.get(taskId);
    if (!task) throw new Error(`Unknown task "${taskId}" referenced as a dependency`);
    const taskSuccessors = successors.get(taskId) ?? [];
    const finish = taskSuccessors.length === 0 ? projectDuration : Math.min(...taskSuccessors.map((successor) => computeLate(successor)));
    const start = finish - task.durationDays;
    lateFinish.set(taskId, finish);
    lateStart.set(taskId, start);
    return start;
  }

  for (const task of tasks) {
    computeLate(task.taskId);
  }

  return tasks.map((task) => {
    const start = earlyStart.get(task.taskId) ?? 0;
    const finish = earlyFinish.get(task.taskId) ?? 0;
    const late = lateStart.get(task.taskId) ?? 0;
    const lateFin = lateFinish.get(task.taskId) ?? 0;
    const slack = late - start;
    return {
      taskId: task.taskId,
      durationDays: task.durationDays,
      earlyStart: start,
      earlyFinish: finish,
      lateStart: late,
      lateFinish: lateFin,
      slack,
      isCritical: slack === 0,
      startDate: addDaysIso(projectStartDate, start),
      finishDate: addDaysIso(projectStartDate, finish),
    };
  });
}

export interface ComputeScheduleInput {
  readonly projectId: ProjectId;
  readonly projectStartDate: ISODate;
  readonly tasks: readonly ScheduleTaskInput[];
}

export interface SchedulingEngine {
  computeSchedule(organizationId: OrganizationId, input: ComputeScheduleInput): Promise<Schedule>;
  setBaseline(organizationId: OrganizationId, scheduleId: ScheduleId): Promise<Schedule>;
  getBaseline(organizationId: OrganizationId, projectId: ProjectId): Promise<Schedule | null>;
  get(organizationId: OrganizationId, scheduleId: ScheduleId): Promise<Schedule | null>;
  list(organizationId: OrganizationId): Promise<readonly Schedule[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Schedule[]>;
  getCriticalPath(organizationId: OrganizationId, scheduleId: ScheduleId): Promise<readonly ScheduleEntry[]>;
}

/** Creates a real {@link SchedulingEngine}. */
export function createSchedulingEngine(repository: ScheduleRepository, now: () => string = nowIso): SchedulingEngine {
  async function requireSchedule(organizationId: OrganizationId, scheduleId: ScheduleId): Promise<Schedule> {
    const schedule = await repository.findById(organizationId, scheduleId);
    if (!schedule) throw new ScheduleNotFoundError(scheduleId);
    return schedule;
  }

  return {
    async computeSchedule(organizationId, input) {
      const entries = computeCriticalPathSchedule(input.tasks, input.projectStartDate);
      const timestamp = now();
      const schedule: Schedule = {
        id: generateId('schedule'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: input.projectId,
        projectStartDate: input.projectStartDate,
        entries,
        isBaseline: false,
      };
      await repository.save(schedule);
      return schedule;
    },

    async setBaseline(organizationId, scheduleId) {
      const schedule = await requireSchedule(organizationId, scheduleId);
      const existingBaseline = await repository.findBaseline(organizationId, schedule.projectId);
      if (existingBaseline && existingBaseline.id !== scheduleId) {
        await repository.save({ ...existingBaseline, isBaseline: false, updatedAt: now() });
      }
      const updated: Schedule = { ...schedule, isBaseline: true, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getBaseline(organizationId, projectId) {
      return repository.findBaseline(organizationId, projectId);
    },

    async get(organizationId, scheduleId) {
      return repository.findById(organizationId, scheduleId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByProject(organizationId, projectId) {
      return repository.findByProject(organizationId, projectId);
    },

    async getCriticalPath(organizationId, scheduleId) {
      const schedule = await requireSchedule(organizationId, scheduleId);
      return schedule.entries.filter((entry) => entry.isCritical);
    },
  };
}
