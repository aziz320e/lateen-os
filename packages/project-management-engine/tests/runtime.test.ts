import { describe, expect, it } from 'vitest';
import { createProjectRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createProjectRuntime', () => {
  it('wires every module together and works fully offline', async () => {
    const runtime = createProjectRuntime();
    const project = await runtime.projects.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    expect(project.status).toBe('draft');
    expect(await runtime.relationships.getCustomerContext(ORG, 'customer-1')).toBeNull();
  });

  it('shares one event bus across every engine by default', async () => {
    const runtime = createProjectRuntime();
    let seen: unknown;
    runtime.events.subscribe('project.created', (payload) => (seen = payload));
    const project = await runtime.projects.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    expect(seen).toEqual({ organizationId: ORG, projectId: project.id, name: 'Website Revamp' });
  });

  it('accepts an injected event bus and clock', async () => {
    const { createProjectEventBus } = await import('../src/events/index.js');
    const eventBus = createProjectEventBus();
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const runtime = createProjectRuntime({ eventBus, now: fixedNow });
    const project = await runtime.projects.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    expect(project.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(runtime.events).toBe(eventBus);
  });

  it('queries reflect state mutated through the engines', async () => {
    const runtime = createProjectRuntime();
    await runtime.projects.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const result = await runtime.queries.findProjects({ organizationId: ORG });
    expect(result.total).toBe(1);
  });

  it('tasks created against a project are queryable through the runtime', async () => {
    const runtime = createProjectRuntime();
    const project = await runtime.projects.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    await runtime.tasks.create(ORG, { projectId: project.id, title: 'Design homepage' });
    const result = await runtime.queries.findTasks({ organizationId: ORG, projectId: project.id });
    expect(result.total).toBe(1);
  });

  it('resource assignments, budgets, and risks all compose against the same project id', async () => {
    const runtime = createProjectRuntime();
    const project = await runtime.projects.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    await runtime.resources.assign(ORG, { projectId: project.id, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 50 });
    const budget = await runtime.budgets.createBudget(ORG, { projectId: project.id, currency: 'USD', plannedBudget: '10000.00' });
    await runtime.budgets.recordCost(ORG, budget.id, '2000.00');
    const risk = await runtime.risks.create(ORG, { projectId: project.id, title: 'Vendor delay', probability: 3, impact: 4 });

    expect((await runtime.queries.findAssignments({ organizationId: ORG, projectId: project.id })).total).toBe(1);
    expect((await runtime.queries.findBudgets({ organizationId: ORG, projectId: project.id })).total).toBe(1);
    expect((await runtime.queries.findRisks({ organizationId: ORG, projectId: project.id })).total).toBe(1);
    expect(await runtime.budgets.getRemainingBudget(ORG, budget.id)).toBe('8000.00');
    expect(risk.score).toBe(12);
  });

  it('scheduling composes with task durations to produce a critical path', async () => {
    const runtime = createProjectRuntime();
    const project = await runtime.projects.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const design = await runtime.tasks.create(ORG, { projectId: project.id, title: 'Design' });
    const build = await runtime.tasks.create(ORG, { projectId: project.id, title: 'Build', dependsOnTaskIds: [design.id] });

    const schedule = await runtime.scheduling.computeSchedule(ORG, {
      projectId: project.id,
      projectStartDate: '2026-01-01',
      tasks: [
        { taskId: design.id, durationDays: 3, dependsOnTaskIds: [] },
        { taskId: build.id, durationDays: 5, dependsOnTaskIds: [design.id] },
      ],
    });
    expect(schedule.entries.every((entry) => entry.isCritical)).toBe(true);
  });

  it('material requirements and deliverables are queryable through the runtime', async () => {
    const runtime = createProjectRuntime();
    const project = await runtime.projects.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    await runtime.materials.createRequirement(ORG, { projectId: project.id, itemId: 'item-1', requiredQuantity: '50.00' });
    const deliverable = await runtime.deliverables.create(ORG, { projectId: project.id, name: 'Final Mockups' });

    expect(await runtime.materials.findByProject(ORG, project.id)).toHaveLength(1);
    expect((await runtime.queries.findDeliverables({ organizationId: ORG, projectId: project.id })).total).toBe(1);
    expect(deliverable.status).toBe('draft');
  });

  it('searchProjects() finds records created through the runtime engines', async () => {
    const runtime = createProjectRuntime();
    await runtime.projects.create(ORG, { code: 'UNIQUE-999', name: 'UniqueProjectName' });
    const result = await runtime.queries.searchProjects({ organizationId: ORG, keyword: 'UniqueProjectName' });
    expect(result.total).toBe(1);
  });
});
