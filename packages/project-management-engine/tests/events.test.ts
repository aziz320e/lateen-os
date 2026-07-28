import { describe, expect, it } from 'vitest';
import { createProjectEventBus, PROJECT_EVENT_NAMES } from '../src/events/index.js';

describe('ProjectEventBus', () => {
  it('publishes and delivers events by name', () => {
    const bus = createProjectEventBus();
    let seen: unknown;
    bus.subscribe('project.created', (payload) => (seen = payload));
    bus.publish('project.created', { organizationId: 'org-1', projectId: 'project-1', name: 'Website Revamp' });
    expect(seen).toEqual({ organizationId: 'org-1', projectId: 'project-1', name: 'Website Revamp' });
  });

  it('subscribeAll() receives every event regardless of name', () => {
    const bus = createProjectEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('project.started', { organizationId: 'org-1', projectId: 'project-1' });
    bus.publish('project.completed', { organizationId: 'org-1', projectId: 'project-1' });
    expect(names).toEqual(['project.started', 'project.completed']);
  });

  it('unsubscribe stops delivery', () => {
    const bus = createProjectEventBus();
    let count = 0;
    const unsubscribe = bus.subscribe('task.created', () => (count += 1));
    bus.publish('task.created', { organizationId: 'org-1', taskId: 'task-1', projectId: 'project-1', title: 'Design' });
    unsubscribe();
    bus.publish('task.created', { organizationId: 'org-1', taskId: 'task-1', projectId: 'project-1', title: 'Design' });
    expect(count).toBe(1);
  });

  it('delivers project.cancelled with its payload', () => {
    const bus = createProjectEventBus();
    let seen: unknown;
    bus.subscribe('project.cancelled', (payload) => (seen = payload));
    bus.publish('project.cancelled', { organizationId: 'org-1', projectId: 'project-1', reason: 'Budget cut' });
    expect(seen).toEqual({ organizationId: 'org-1', projectId: 'project-1', reason: 'Budget cut' });
  });

  it('delivers task.completed with its payload', () => {
    const bus = createProjectEventBus();
    let seen: unknown;
    bus.subscribe('task.completed', (payload) => (seen = payload));
    bus.publish('task.completed', { organizationId: 'org-1', taskId: 'task-1', projectId: 'project-1' });
    expect(seen).toEqual({ organizationId: 'org-1', taskId: 'task-1', projectId: 'project-1' });
  });

  it('delivers resource.assigned with its payload', () => {
    const bus = createProjectEventBus();
    let seen: unknown;
    bus.subscribe('resource.assigned', (payload) => (seen = payload));
    bus.publish('resource.assigned', { organizationId: 'org-1', assignmentId: 'assignment-1', projectId: 'project-1', assigneeId: 'employee-1', assigneeType: 'employee' });
    expect(seen).toEqual({ organizationId: 'org-1', assignmentId: 'assignment-1', projectId: 'project-1', assigneeId: 'employee-1', assigneeType: 'employee' });
  });

  it('delivers budget.updated with its payload', () => {
    const bus = createProjectEventBus();
    let seen: unknown;
    bus.subscribe('budget.updated', (payload) => (seen = payload));
    bus.publish('budget.updated', { organizationId: 'org-1', budgetId: 'budget-1', projectId: 'project-1', remainingBudget: '5000.00' });
    expect(seen).toEqual({ organizationId: 'org-1', budgetId: 'budget-1', projectId: 'project-1', remainingBudget: '5000.00' });
  });

  it('delivers risk.created with its payload', () => {
    const bus = createProjectEventBus();
    let seen: unknown;
    bus.subscribe('risk.created', (payload) => (seen = payload));
    bus.publish('risk.created', { organizationId: 'org-1', riskId: 'risk-1', projectId: 'project-1', score: 12 });
    expect(seen).toEqual({ organizationId: 'org-1', riskId: 'risk-1', projectId: 'project-1', score: 12 });
  });

  it('delivers deliverable.accepted with its payload', () => {
    const bus = createProjectEventBus();
    let seen: unknown;
    bus.subscribe('deliverable.accepted', (payload) => (seen = payload));
    bus.publish('deliverable.accepted', { organizationId: 'org-1', deliverableId: 'deliverable-1', projectId: 'project-1' });
    expect(seen).toEqual({ organizationId: 'org-1', deliverableId: 'deliverable-1', projectId: 'project-1' });
  });

  it('delivers project.started with its payload', () => {
    const bus = createProjectEventBus();
    let seen: unknown;
    bus.subscribe('project.started', (payload) => (seen = payload));
    bus.publish('project.started', { organizationId: 'org-1', projectId: 'project-1' });
    expect(seen).toEqual({ organizationId: 'org-1', projectId: 'project-1' });
  });

  it('delivers project.completed with its payload', () => {
    const bus = createProjectEventBus();
    let seen: unknown;
    bus.subscribe('project.completed', (payload) => (seen = payload));
    bus.publish('project.completed', { organizationId: 'org-1', projectId: 'project-1' });
    expect(seen).toEqual({ organizationId: 'org-1', projectId: 'project-1' });
  });

  it('multiple independent subscribers to the same event all receive it', () => {
    const bus = createProjectEventBus();
    let countA = 0;
    let countB = 0;
    bus.subscribe('project.created', () => (countA += 1));
    bus.subscribe('project.created', () => (countB += 1));
    bus.publish('project.created', { organizationId: 'org-1', projectId: 'project-1', name: 'Website Revamp' });
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  });

  it('PROJECT_EVENT_NAMES exposes all 10 canonical event names', () => {
    expect(Object.values(PROJECT_EVENT_NAMES)).toEqual([
      'project.created',
      'project.started',
      'project.completed',
      'project.cancelled',
      'task.created',
      'task.completed',
      'resource.assigned',
      'budget.updated',
      'risk.created',
      'deliverable.accepted',
    ]);
  });
});
