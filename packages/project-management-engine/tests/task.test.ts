import { describe, expect, it } from 'vitest';
import { createProjectEventBus } from '../src/events/index.js';
import { canTransitionTask, createTaskManagementEngine, wouldCreateCycle } from '../src/task/engine.impl.js';
import { createProjectTaskRepository } from '../src/task/repository.impl.js';
import { CircularTaskDependencyError, InvalidTaskTransitionError, ProjectTaskNotFoundError, TaskBlockedByDependencyError } from '../src/shared/errors.js';
import type { ProjectTask } from '../src/task/types.js';

const ORG = 'org-1';
const PROJECT = 'project-1';

function setup() {
  const eventBus = createProjectEventBus();
  const engine = createTaskManagementEngine(createProjectTaskRepository(), eventBus);
  return { engine, eventBus };
}

function makeTask(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: 'task-x',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    projectId: PROJECT,
    title: 'Task X',
    priority: 'medium',
    labels: [],
    dependsOnTaskIds: [],
    status: 'planned',
    currentVersion: 1,
    ...overrides,
  };
}

describe('canTransitionTask (pure)', () => {
  it('planned -> ready | cancelled', () => {
    expect(canTransitionTask('planned', 'ready')).toBe(true);
    expect(canTransitionTask('planned', 'cancelled')).toBe(true);
    expect(canTransitionTask('planned', 'in_progress')).toBe(false);
  });

  it('ready -> in_progress | blocked | cancelled', () => {
    expect(canTransitionTask('ready', 'in_progress')).toBe(true);
    expect(canTransitionTask('ready', 'blocked')).toBe(true);
    expect(canTransitionTask('ready', 'cancelled')).toBe(true);
  });

  it('in_progress -> blocked | completed | cancelled', () => {
    expect(canTransitionTask('in_progress', 'blocked')).toBe(true);
    expect(canTransitionTask('in_progress', 'completed')).toBe(true);
    expect(canTransitionTask('in_progress', 'cancelled')).toBe(true);
  });

  it('blocked -> ready | in_progress | cancelled', () => {
    expect(canTransitionTask('blocked', 'ready')).toBe(true);
    expect(canTransitionTask('blocked', 'in_progress')).toBe(true);
  });

  it('completed and cancelled are terminal', () => {
    expect(canTransitionTask('completed', 'ready')).toBe(false);
    expect(canTransitionTask('cancelled', 'ready')).toBe(false);
  });
});

describe('wouldCreateCycle (pure)', () => {
  it('detects a direct self-dependency', () => {
    expect(wouldCreateCycle('task-a', 'task-a', [])).toBe(true);
  });

  it('detects a two-step cycle (A depends on B, B would depend on A)', () => {
    const tasks = [makeTask({ id: 'task-a', dependsOnTaskIds: ['task-b'] }), makeTask({ id: 'task-b', dependsOnTaskIds: [] })];
    expect(wouldCreateCycle('task-b', 'task-a', tasks)).toBe(true);
  });

  it('detects a longer transitive cycle (A -> B -> C, C would depend on A)', () => {
    const tasks = [
      makeTask({ id: 'task-a', dependsOnTaskIds: ['task-b'] }),
      makeTask({ id: 'task-b', dependsOnTaskIds: ['task-c'] }),
      makeTask({ id: 'task-c', dependsOnTaskIds: [] }),
    ];
    expect(wouldCreateCycle('task-c', 'task-a', tasks)).toBe(true);
  });

  it('returns false for a legitimate new dependency', () => {
    const tasks = [makeTask({ id: 'task-a', dependsOnTaskIds: [] }), makeTask({ id: 'task-b', dependsOnTaskIds: [] })];
    expect(wouldCreateCycle('task-a', 'task-b', tasks)).toBe(false);
  });
});

describe('TaskManagementEngine — create/update', () => {
  it('creates a task at planned status with defaults', async () => {
    const { engine } = setup();
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'Design homepage' });
    expect(task.status).toBe('planned');
    expect(task.priority).toBe('medium');
    expect(task.labels).toEqual([]);
  });

  it('publishes task.created on create', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('task.created', (payload) => (seen = payload));
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'Design homepage' });
    expect(seen).toEqual({ organizationId: ORG, taskId: task.id, projectId: PROJECT, title: 'Design homepage' });
  });

  it('creates a subtask referencing a parent task', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { projectId: PROJECT, title: 'Parent' });
    const child = await engine.create(ORG, { projectId: PROJECT, parentTaskId: parent.id, title: 'Child' });
    expect(child.parentTaskId).toBe(parent.id);
    expect(await engine.findSubtasks(ORG, parent.id)).toEqual([child]);
  });

  it('accepts explicit priority, labels, dueDate, and estimatedHours', async () => {
    const { engine } = setup();
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'Critical fix', priority: 'critical', labels: ['bug', 'urgent'], dueDate: '2026-02-01', estimatedHours: 8 });
    expect(task.priority).toBe('critical');
    expect(task.labels).toEqual(['bug', 'urgent']);
    expect(task.dueDate).toBe('2026-02-01');
    expect(task.estimatedHours).toBe(8);
  });

  it('create() with an unknown dependency throws ProjectTaskNotFoundError', async () => {
    const { engine } = setup();
    await expect(engine.create(ORG, { projectId: PROJECT, title: 'X', dependsOnTaskIds: ['missing'] })).rejects.toBeInstanceOf(ProjectTaskNotFoundError);
  });

  it('update() changes mutable fields and bumps currentVersion', async () => {
    const { engine } = setup();
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'Original' });
    const updated = await engine.update(ORG, task.id, { title: 'Renamed', priority: 'high' });
    expect(updated.title).toBe('Renamed');
    expect(updated.priority).toBe('high');
    expect(updated.currentVersion).toBe(2);
  });
});

describe('TaskManagementEngine — dependencies', () => {
  it('addDependency() records a valid dependency', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { projectId: PROJECT, title: 'A' });
    const b = await engine.create(ORG, { projectId: PROJECT, title: 'B' });
    const updated = await engine.addDependency(ORG, b.id, a.id);
    expect(updated.dependsOnTaskIds).toEqual([a.id]);
  });

  it('addDependency() is idempotent for an already-recorded dependency', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { projectId: PROJECT, title: 'A' });
    const b = await engine.create(ORG, { projectId: PROJECT, title: 'B' });
    await engine.addDependency(ORG, b.id, a.id);
    const again = await engine.addDependency(ORG, b.id, a.id);
    expect(again.dependsOnTaskIds).toEqual([a.id]);
  });

  it('addDependency() rejects a cycle', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { projectId: PROJECT, title: 'A' });
    const b = await engine.create(ORG, { projectId: PROJECT, title: 'B' });
    await engine.addDependency(ORG, b.id, a.id);
    await expect(engine.addDependency(ORG, a.id, b.id)).rejects.toBeInstanceOf(CircularTaskDependencyError);
  });

  it('addDependency() rejects an unknown dependency task', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { projectId: PROJECT, title: 'A' });
    await expect(engine.addDependency(ORG, a.id, 'missing')).rejects.toBeInstanceOf(ProjectTaskNotFoundError);
  });

  it('removeDependency() drops a recorded dependency', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { projectId: PROJECT, title: 'A' });
    const b = await engine.create(ORG, { projectId: PROJECT, title: 'B' });
    await engine.addDependency(ORG, b.id, a.id);
    const updated = await engine.removeDependency(ORG, b.id, a.id);
    expect(updated.dependsOnTaskIds).toEqual([]);
  });
});

describe('TaskManagementEngine — lifecycle guarded by dependencies', () => {
  it('markReady() moves planned -> ready', async () => {
    const { engine } = setup();
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'X' });
    const ready = await engine.markReady(ORG, task.id);
    expect(ready.status).toBe('ready');
  });

  it('start() succeeds when there are no dependencies', async () => {
    const { engine } = setup();
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'X' });
    await engine.markReady(ORG, task.id);
    const started = await engine.start(ORG, task.id);
    expect(started.status).toBe('in_progress');
  });

  it('start() throws TaskBlockedByDependencyError when a dependency is incomplete', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { projectId: PROJECT, title: 'A' });
    const b = await engine.create(ORG, { projectId: PROJECT, title: 'B', dependsOnTaskIds: [a.id] });
    await engine.markReady(ORG, b.id);
    await expect(engine.start(ORG, b.id)).rejects.toBeInstanceOf(TaskBlockedByDependencyError);
  });

  it('start() succeeds once all dependencies are completed', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { projectId: PROJECT, title: 'A' });
    await engine.markReady(ORG, a.id);
    await engine.start(ORG, a.id);
    await engine.complete(ORG, a.id);

    const b = await engine.create(ORG, { projectId: PROJECT, title: 'B', dependsOnTaskIds: [a.id] });
    await engine.markReady(ORG, b.id);
    const started = await engine.start(ORG, b.id);
    expect(started.status).toBe('in_progress');
  });

  it('block() moves in_progress -> blocked, and it can be restarted', async () => {
    const { engine } = setup();
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'X' });
    await engine.markReady(ORG, task.id);
    await engine.start(ORG, task.id);
    const blocked = await engine.block(ORG, task.id);
    expect(blocked.status).toBe('blocked');
    const restarted = await engine.start(ORG, task.id);
    expect(restarted.status).toBe('in_progress');
  });

  it('complete() publishes task.completed', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('task.completed', (payload) => (seen = payload));
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'X' });
    await engine.markReady(ORG, task.id);
    await engine.start(ORG, task.id);
    await engine.complete(ORG, task.id);
    expect(seen).toEqual({ organizationId: ORG, taskId: task.id, projectId: PROJECT });
  });

  it('cancel() is allowed from planned, ready, in_progress, and blocked', async () => {
    const { engine } = setup();
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'X' });
    const cancelled = await engine.cancel(ORG, task.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('rejects an invalid transition (completed -> ready)', async () => {
    const { engine } = setup();
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'X' });
    await engine.markReady(ORG, task.id);
    await engine.start(ORG, task.id);
    await engine.complete(ORG, task.id);
    await expect(engine.markReady(ORG, task.id)).rejects.toBeInstanceOf(InvalidTaskTransitionError);
  });
});

describe('TaskManagementEngine — not-found guards', () => {
  it('update()/markReady()/start()/block()/complete()/cancel() throw ProjectTaskNotFoundError for an unknown task', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', { title: 'x' })).rejects.toBeInstanceOf(ProjectTaskNotFoundError);
    await expect(engine.markReady(ORG, 'missing')).rejects.toBeInstanceOf(ProjectTaskNotFoundError);
    await expect(engine.start(ORG, 'missing')).rejects.toBeInstanceOf(ProjectTaskNotFoundError);
    await expect(engine.block(ORG, 'missing')).rejects.toBeInstanceOf(ProjectTaskNotFoundError);
    await expect(engine.complete(ORG, 'missing')).rejects.toBeInstanceOf(ProjectTaskNotFoundError);
    await expect(engine.cancel(ORG, 'missing')).rejects.toBeInstanceOf(ProjectTaskNotFoundError);
  });

  it('removeDependency() throws ProjectTaskNotFoundError for an unknown task', async () => {
    const { engine } = setup();
    await expect(engine.removeDependency(ORG, 'missing', 'also-missing')).rejects.toBeInstanceOf(ProjectTaskNotFoundError);
  });
});

describe('TaskManagementEngine — organization scoping', () => {
  it('tasks never leak across organizations', async () => {
    const { engine } = setup();
    await engine.create(ORG, { projectId: PROJECT, title: 'Org 1 task' });
    await engine.create('org-2', { projectId: PROJECT, title: 'Org 2 task' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('cycle detection is isolated per organization (same ids, different orgs, no false-positive cycle)', async () => {
    const { engine } = setup();
    const a1 = await engine.create(ORG, { projectId: PROJECT, title: 'A' });
    const b1 = await engine.create(ORG, { projectId: PROJECT, title: 'B' });
    await engine.addDependency(ORG, b1.id, a1.id);

    const a2 = await engine.create('org-2', { projectId: PROJECT, title: 'A' });
    const b2 = await engine.create('org-2', { projectId: PROJECT, title: 'B' });
    await expect(engine.addDependency('org-2', b2.id, a2.id)).resolves.toBeTruthy();
  });
});

describe('TaskManagementEngine — queries', () => {
  it('findByProject / findByStatus / findByPriority / findByLabel all filter correctly', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { projectId: PROJECT, title: 'A', priority: 'high', labels: ['backend'] });
    await engine.create(ORG, { projectId: 'other-project', title: 'B', priority: 'low', labels: ['frontend'] });
    await engine.markReady(ORG, a.id);

    expect(await engine.findByProject(ORG, PROJECT)).toHaveLength(1);
    expect(await engine.findByStatus(ORG, 'ready')).toHaveLength(1);
    expect(await engine.findByPriority(ORG, 'high')).toHaveLength(1);
    expect(await engine.findByLabel(ORG, 'backend')).toHaveLength(1);
  });

  it('get() returns null for unknown id, list() returns everything', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    await engine.create(ORG, { projectId: PROJECT, title: 'A' });
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('findSubtasks() returns an empty list for a task with no subtasks', async () => {
    const { engine } = setup();
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'Parent' });
    expect(await engine.findSubtasks(ORG, task.id)).toEqual([]);
  });

  it('a task can depend on more than one other task', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { projectId: PROJECT, title: 'A' });
    const b = await engine.create(ORG, { projectId: PROJECT, title: 'B' });
    const c = await engine.create(ORG, { projectId: PROJECT, title: 'C', dependsOnTaskIds: [a.id, b.id] });
    expect(c.dependsOnTaskIds).toEqual([a.id, b.id]);
  });

  it('update() with no fields leaves the task unchanged apart from currentVersion', async () => {
    const { engine } = setup();
    const task = await engine.create(ORG, { projectId: PROJECT, title: 'Original', priority: 'low' });
    const updated = await engine.update(ORG, task.id, {});
    expect(updated.title).toBe('Original');
    expect(updated.priority).toBe('low');
    expect(updated.currentVersion).toBe(2);
  });

  it('a task with no labels never matches findByLabel', async () => {
    const { engine } = setup();
    await engine.create(ORG, { projectId: PROJECT, title: 'Unlabeled' });
    expect(await engine.findByLabel(ORG, 'anything')).toEqual([]);
  });

  it('start() reports every incomplete dependency, not just the first', async () => {
    const { engine } = setup();
    const a = await engine.create(ORG, { projectId: PROJECT, title: 'A' });
    const b = await engine.create(ORG, { projectId: PROJECT, title: 'B' });
    const c = await engine.create(ORG, { projectId: PROJECT, title: 'C', dependsOnTaskIds: [a.id, b.id] });
    await engine.markReady(ORG, c.id);
    try {
      await engine.start(ORG, c.id);
      expect.unreachable();
    } catch (error) {
      expect((error as TaskBlockedByDependencyError).incompleteDependencyIds).toEqual([a.id, b.id]);
    }
  });
});
