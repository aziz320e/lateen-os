/**
 * Real Task Management engine — tasks and subtasks with dependencies,
 * priorities, labels, and due dates, guarded by a
 * planned/ready/in_progress/blocked/completed/cancelled lifecycle.
 *
 * Dependency-aware: a task cannot start while any of its dependencies
 * is incomplete, and a dependency can never be added if it would form
 * a cycle.
 *
 * @module task/engine.impl
 */
import type { ProjectEventBus } from '../events/project-event-bus.js';
import {
  CircularTaskDependencyError,
  InvalidTaskTransitionError,
  ProjectTaskNotFoundError,
  TaskBlockedByDependencyError,
} from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, ProjectId, ProjectTaskId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { ProjectTaskRepository } from './repository.js';
import type { ProjectTask, TaskPriority, TaskStatus } from './types.js';

const TASK_TRANSITIONS: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  planned: ['ready', 'cancelled'],
  ready: ['in_progress', 'blocked', 'cancelled'],
  in_progress: ['blocked', 'completed', 'cancelled'],
  blocked: ['ready', 'in_progress', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** Whether a task may transition from one status to another. */
export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS[from].includes(to);
}

/** Whether adding `dependsOnTaskId` as a dependency of `taskId` would create a cycle, given the full set of tasks in the project. */
export function wouldCreateCycle(taskId: ProjectTaskId, dependsOnTaskId: ProjectTaskId, allTasks: readonly ProjectTask[]): boolean {
  if (taskId === dependsOnTaskId) return true;
  const byId = new Map(allTasks.map((task) => [task.id, task] as const));
  const visited = new Set<ProjectTaskId>();
  const stack: ProjectTaskId[] = [dependsOnTaskId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    if (current === taskId) return true;
    const currentTask = byId.get(current);
    if (currentTask) stack.push(...currentTask.dependsOnTaskIds);
  }
  return false;
}

export interface CreateProjectTaskInput {
  readonly projectId: ProjectId;
  readonly parentTaskId?: ProjectTaskId;
  readonly title: string;
  readonly description?: string;
  readonly priority?: TaskPriority;
  readonly labels?: readonly string[];
  readonly dueDate?: ISODate;
  readonly dependsOnTaskIds?: readonly ProjectTaskId[];
  readonly estimatedHours?: number;
}

export interface UpdateProjectTaskInput {
  readonly title?: string;
  readonly description?: string;
  readonly priority?: TaskPriority;
  readonly labels?: readonly string[];
  readonly dueDate?: ISODate;
  readonly estimatedHours?: number;
}

export interface TaskManagementEngine {
  create(organizationId: OrganizationId, input: CreateProjectTaskInput): Promise<ProjectTask>;
  update(organizationId: OrganizationId, taskId: ProjectTaskId, input: UpdateProjectTaskInput): Promise<ProjectTask>;
  addDependency(organizationId: OrganizationId, taskId: ProjectTaskId, dependsOnTaskId: ProjectTaskId): Promise<ProjectTask>;
  removeDependency(organizationId: OrganizationId, taskId: ProjectTaskId, dependsOnTaskId: ProjectTaskId): Promise<ProjectTask>;
  markReady(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<ProjectTask>;
  start(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<ProjectTask>;
  block(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<ProjectTask>;
  complete(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<ProjectTask>;
  cancel(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<ProjectTask>;
  get(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<ProjectTask | null>;
  list(organizationId: OrganizationId): Promise<readonly ProjectTask[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly ProjectTask[]>;
  findSubtasks(organizationId: OrganizationId, parentTaskId: ProjectTaskId): Promise<readonly ProjectTask[]>;
  findByStatus(organizationId: OrganizationId, status: TaskStatus): Promise<readonly ProjectTask[]>;
  findByPriority(organizationId: OrganizationId, priority: TaskPriority): Promise<readonly ProjectTask[]>;
  findByLabel(organizationId: OrganizationId, label: string): Promise<readonly ProjectTask[]>;
}

/** Creates a real {@link TaskManagementEngine}. */
export function createTaskManagementEngine(
  repository: ProjectTaskRepository,
  eventBus?: ProjectEventBus,
  now: () => string = nowIso,
): TaskManagementEngine {
  async function requireTask(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<ProjectTask> {
    const task = await repository.findById(organizationId, taskId);
    if (!task) throw new ProjectTaskNotFoundError(taskId);
    return task;
  }

  async function transition(organizationId: OrganizationId, taskId: ProjectTaskId, to: TaskStatus): Promise<ProjectTask> {
    const task = await requireTask(organizationId, taskId);
    if (!canTransitionTask(task.status, to)) {
      throw new InvalidTaskTransitionError(taskId, task.status, to);
    }
    const updated: ProjectTask = { ...task, status: to, currentVersion: task.currentVersion + 1, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      for (const dependsOnTaskId of input.dependsOnTaskIds ?? []) {
        await requireTask(organizationId, dependsOnTaskId);
      }
      const timestamp = now();
      const task: ProjectTask = {
        id: generateId('project-task'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: input.projectId,
        parentTaskId: input.parentTaskId,
        title: input.title,
        description: input.description,
        priority: input.priority ?? 'medium',
        labels: input.labels ?? [],
        dueDate: input.dueDate,
        dependsOnTaskIds: input.dependsOnTaskIds ?? [],
        estimatedHours: input.estimatedHours,
        status: 'planned',
        currentVersion: 1,
      };
      await repository.save(task);
      eventBus?.publish('task.created', { organizationId, taskId: task.id, projectId: task.projectId, title: task.title });
      return task;
    },

    async update(organizationId, taskId, input) {
      const task = await requireTask(organizationId, taskId);
      const updated: ProjectTask = {
        ...task,
        title: input.title ?? task.title,
        description: input.description ?? task.description,
        priority: input.priority ?? task.priority,
        labels: input.labels ?? task.labels,
        dueDate: input.dueDate ?? task.dueDate,
        estimatedHours: input.estimatedHours ?? task.estimatedHours,
        currentVersion: task.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async addDependency(organizationId, taskId, dependsOnTaskId) {
      const task = await requireTask(organizationId, taskId);
      await requireTask(organizationId, dependsOnTaskId);
      const allTasks = await repository.findAll(organizationId);
      if (wouldCreateCycle(taskId, dependsOnTaskId, allTasks)) {
        throw new CircularTaskDependencyError(taskId, dependsOnTaskId);
      }
      if (task.dependsOnTaskIds.includes(dependsOnTaskId)) return task;
      const updated: ProjectTask = { ...task, dependsOnTaskIds: [...task.dependsOnTaskIds, dependsOnTaskId], currentVersion: task.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async removeDependency(organizationId, taskId, dependsOnTaskId) {
      const task = await requireTask(organizationId, taskId);
      const updated: ProjectTask = {
        ...task,
        dependsOnTaskIds: task.dependsOnTaskIds.filter((id) => id !== dependsOnTaskId),
        currentVersion: task.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async markReady(organizationId, taskId) {
      return transition(organizationId, taskId, 'ready');
    },

    async start(organizationId, taskId) {
      const task = await requireTask(organizationId, taskId);
      const incomplete: ProjectTaskId[] = [];
      for (const dependsOnTaskId of task.dependsOnTaskIds) {
        const dependency = await repository.findById(organizationId, dependsOnTaskId);
        if (dependency && dependency.status !== 'completed') incomplete.push(dependsOnTaskId);
      }
      if (incomplete.length > 0) throw new TaskBlockedByDependencyError(taskId, incomplete);
      return transition(organizationId, taskId, 'in_progress');
    },

    async block(organizationId, taskId) {
      return transition(organizationId, taskId, 'blocked');
    },

    async complete(organizationId, taskId) {
      const updated = await transition(organizationId, taskId, 'completed');
      eventBus?.publish('task.completed', { organizationId, taskId, projectId: updated.projectId });
      return updated;
    },

    async cancel(organizationId, taskId) {
      return transition(organizationId, taskId, 'cancelled');
    },

    async get(organizationId, taskId) {
      return repository.findById(organizationId, taskId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByProject(organizationId, projectId) {
      return repository.findByProject(organizationId, projectId);
    },

    async findSubtasks(organizationId, parentTaskId) {
      return repository.findByParent(organizationId, parentTaskId);
    },

    async findByStatus(organizationId, status) {
      return repository.findByStatus(organizationId, status);
    },

    async findByPriority(organizationId, priority) {
      return repository.findByPriority(organizationId, priority);
    },

    async findByLabel(organizationId, label) {
      return repository.findByLabel(organizationId, label);
    },
  };
}
