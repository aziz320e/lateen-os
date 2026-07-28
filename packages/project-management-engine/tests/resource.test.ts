import { describe, expect, it } from 'vitest';
import { createProjectEventBus } from '../src/events/index.js';
import {
  computeRemainingCapacity,
  computeTotalAllocation,
  createResourcePlanningEngine,
  DEFAULT_CAPACITY_PERCENTAGE,
  isOverAllocated,
} from '../src/resource/engine.impl.js';
import { createResourceAssignmentRepository } from '../src/resource/repository.impl.js';
import { OverAllocationError, ResourceAssignmentNotFoundError } from '../src/shared/errors.js';
import type { ResourceAssignment } from '../src/resource/types.js';

const ORG = 'org-1';
const PROJECT = 'project-1';

function setup() {
  const eventBus = createProjectEventBus();
  const engine = createResourcePlanningEngine(createResourceAssignmentRepository(), eventBus);
  return { engine, eventBus };
}

function makeAssignment(overrides: Partial<ResourceAssignment> = {}): ResourceAssignment {
  return {
    id: 'assignment-x',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    projectId: PROJECT,
    assigneeType: 'employee',
    assigneeId: 'employee-1',
    allocationPercentage: 50,
    status: 'active',
    ...overrides,
  };
}

describe('computeTotalAllocation (pure)', () => {
  it('sums only active assignments', () => {
    const assignments = [makeAssignment({ allocationPercentage: 40 }), makeAssignment({ allocationPercentage: 30, status: 'cancelled' }), makeAssignment({ allocationPercentage: 20 })];
    expect(computeTotalAllocation(assignments)).toBe(60);
  });

  it('returns 0 for an empty list', () => {
    expect(computeTotalAllocation([])).toBe(0);
  });
});

describe('computeRemainingCapacity / isOverAllocated (pure)', () => {
  it('computeRemainingCapacity floors at 0', () => {
    expect(computeRemainingCapacity(60)).toBe(40);
    expect(computeRemainingCapacity(120)).toBe(0);
  });

  it('respects a custom capacity ceiling', () => {
    expect(computeRemainingCapacity(60, 150)).toBe(90);
  });

  it('isOverAllocated compares against the default 100% ceiling', () => {
    expect(isOverAllocated(100)).toBe(false);
    expect(isOverAllocated(101)).toBe(true);
    expect(DEFAULT_CAPACITY_PERCENTAGE).toBe(100);
  });
});

describe('ResourcePlanningEngine — assign', () => {
  it('assigns an employee resource to a project', async () => {
    const { engine } = setup();
    const assignment = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 50 });
    expect(assignment.status).toBe('active');
    expect(assignment.assigneeType).toBe('employee');
  });

  it('assigns an ai_worker resource to a project', async () => {
    const { engine } = setup();
    const assignment = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'ai_worker', assigneeId: 'ai-worker-1', allocationPercentage: 100 });
    expect(assignment.assigneeType).toBe('ai_worker');
  });

  it('publishes resource.assigned', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('resource.assigned', (payload) => (seen = payload));
    const assignment = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 50 });
    expect(seen).toEqual({ organizationId: ORG, assignmentId: assignment.id, projectId: PROJECT, assigneeId: 'employee-1', assigneeType: 'employee' });
  });

  it('allows multiple assignments to the same assignee up to 100% capacity', async () => {
    const { engine } = setup();
    await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 60 });
    const second = await engine.assign(ORG, { projectId: 'project-2', assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 40 });
    expect(second.allocationPercentage).toBe(40);
  });

  it('rejects an assignment that would exceed 100% capacity', async () => {
    const { engine } = setup();
    await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 60 });
    await expect(engine.assign(ORG, { projectId: 'project-2', assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 50 })).rejects.toBeInstanceOf(OverAllocationError);
  });

  it('respects a custom capacityPercentage ceiling', async () => {
    const { engine } = setup();
    await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 100, capacityPercentage: 200 });
    const second = await engine.assign(ORG, { projectId: 'project-2', assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 90, capacityPercentage: 200 });
    expect(second.allocationPercentage).toBe(90);
  });
});

describe('ResourcePlanningEngine — allocation updates', () => {
  it('updateAllocation() changes the percentage when capacity allows', async () => {
    const { engine } = setup();
    const assignment = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 50 });
    const updated = await engine.updateAllocation(ORG, assignment.id, 80);
    expect(updated.allocationPercentage).toBe(80);
  });

  it('updateAllocation() rejects when it would exceed capacity against other assignments', async () => {
    const { engine } = setup();
    const first = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 50 });
    await engine.assign(ORG, { projectId: 'project-2', assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 40 });
    await expect(engine.updateAllocation(ORG, first.id, 90)).rejects.toBeInstanceOf(OverAllocationError);
  });

  it('updateAllocation() throws for an unknown assignment', async () => {
    const { engine } = setup();
    await expect(engine.updateAllocation(ORG, 'missing', 50)).rejects.toBeInstanceOf(ResourceAssignmentNotFoundError);
  });
});

describe('ResourcePlanningEngine — completion/cancellation and workload', () => {
  it('complete() and cancel() change status without affecting other records', async () => {
    const { engine } = setup();
    const assignment = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 50 });
    const completed = await engine.complete(ORG, assignment.id);
    expect(completed.status).toBe('completed');

    const other = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-2', allocationPercentage: 30 });
    const cancelled = await engine.cancel(ORG, other.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('a completed assignment frees up capacity for a new one', async () => {
    const { engine } = setup();
    const assignment = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 80 });
    await engine.complete(ORG, assignment.id);
    const second = await engine.assign(ORG, { projectId: 'project-2', assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 80 });
    expect(second.allocationPercentage).toBe(80);
  });

  it('getWorkload() sums active allocation across all projects for an assignee', async () => {
    const { engine } = setup();
    await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 30 });
    await engine.assign(ORG, { projectId: 'project-2', assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 20 });
    expect(await engine.getWorkload(ORG, 'employee-1')).toBe(50);
  });

  it('getRemainingCapacity() reflects current workload', async () => {
    const { engine } = setup();
    await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 30 });
    expect(await engine.getRemainingCapacity(ORG, 'employee-1')).toBe(70);
  });

  it('findByProject / findByTask / findByAssignee filter correctly', async () => {
    const { engine } = setup();
    const assignment = await engine.assign(ORG, { projectId: PROJECT, taskId: 'task-1', assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 30 });
    await engine.assign(ORG, { projectId: 'project-2', assigneeType: 'employee', assigneeId: 'employee-2', allocationPercentage: 30 });

    expect(await engine.findByProject(ORG, PROJECT)).toEqual([assignment]);
    expect(await engine.findByTask(ORG, 'task-1')).toEqual([assignment]);
    expect(await engine.findByAssignee(ORG, 'employee-1')).toEqual([assignment]);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const assignment = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 30 });
    expect(await engine.get(ORG, assignment.id)).toEqual(assignment);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('complete()/cancel() throw ResourceAssignmentNotFoundError for an unknown assignment', async () => {
    const { engine } = setup();
    await expect(engine.complete(ORG, 'missing')).rejects.toBeInstanceOf(ResourceAssignmentNotFoundError);
    await expect(engine.cancel(ORG, 'missing')).rejects.toBeInstanceOf(ResourceAssignmentNotFoundError);
  });

  it('getWorkload() and getRemainingCapacity() default to 0/100 for an assignee with no assignments', async () => {
    const { engine } = setup();
    expect(await engine.getWorkload(ORG, 'unassigned-employee')).toBe(0);
    expect(await engine.getRemainingCapacity(ORG, 'unassigned-employee')).toBe(100);
  });

  it('workload is isolated per organization for the same assigneeId', async () => {
    const { engine } = setup();
    await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 90 });
    await engine.assign('org-2', { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 90 });
    expect(await engine.getWorkload(ORG, 'employee-1')).toBe(90);
    expect(await engine.getWorkload('org-2', 'employee-1')).toBe(90);
  });

  it('a cancelled assignment does not count toward workload', async () => {
    const { engine } = setup();
    const assignment = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 60 });
    await engine.cancel(ORG, assignment.id);
    expect(await engine.getWorkload(ORG, 'employee-1')).toBe(0);
  });

  it('findByTask() returns an empty list when no assignment references that task', async () => {
    const { engine } = setup();
    expect(await engine.findByTask(ORG, 'missing-task')).toEqual([]);
  });

  it('an assignment may omit taskId, startDate, and endDate entirely', async () => {
    const { engine } = setup();
    const assignment = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 40 });
    expect(assignment.taskId).toBeUndefined();
    expect(assignment.startDate).toBeUndefined();
    expect(assignment.endDate).toBeUndefined();
  });

  it('assign() accepts explicit startDate and endDate', async () => {
    const { engine } = setup();
    const assignment = await engine.assign(ORG, { projectId: PROJECT, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 40, startDate: '2026-01-01', endDate: '2026-03-01' });
    expect(assignment.startDate).toBe('2026-01-01');
    expect(assignment.endDate).toBe('2026-03-01');
  });
});
