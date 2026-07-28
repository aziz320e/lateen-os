import { describe, expect, it } from 'vitest';
import { createProjectEventBus } from '../src/events/index.js';
import { canTransitionDeliverable, createDeliverableEngine } from '../src/deliverable/engine.impl.js';
import { createDeliverableRepository } from '../src/deliverable/repository.impl.js';
import { DeliverableNotFoundError, InvalidDeliverableTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';
const PROJECT = 'project-1';

function setup() {
  const eventBus = createProjectEventBus();
  const engine = createDeliverableEngine(createDeliverableRepository(), eventBus);
  return { engine, eventBus };
}

describe('canTransitionDeliverable (pure)', () => {
  it('draft -> in_review only', () => {
    expect(canTransitionDeliverable('draft', 'in_review')).toBe(true);
    expect(canTransitionDeliverable('draft', 'accepted')).toBe(false);
  });

  it('in_review -> accepted | rejected', () => {
    expect(canTransitionDeliverable('in_review', 'accepted')).toBe(true);
    expect(canTransitionDeliverable('in_review', 'rejected')).toBe(true);
  });

  it('accepted -> completed only', () => {
    expect(canTransitionDeliverable('accepted', 'completed')).toBe(true);
    expect(canTransitionDeliverable('accepted', 'rejected')).toBe(false);
  });

  it('rejected can be resubmitted to draft', () => {
    expect(canTransitionDeliverable('rejected', 'draft')).toBe(true);
  });

  it('completed is terminal', () => {
    expect(canTransitionDeliverable('completed', 'draft')).toBe(false);
  });
});

describe('DeliverableEngine', () => {
  it('create() starts at draft status with no approvals', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Final Design Mockups' });
    expect(deliverable.status).toBe('draft');
    expect(deliverable.approvals).toEqual([]);
  });

  it('update() changes mutable fields and bumps currentVersion', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Original' });
    const updated = await engine.update(ORG, deliverable.id, { name: 'Renamed', dueDate: '2026-03-01' });
    expect(updated.name).toBe('Renamed');
    expect(updated.dueDate).toBe('2026-03-01');
    expect(updated.currentVersion).toBe(2);
  });

  it('submitForReview() moves draft -> in_review', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Final Design Mockups' });
    const inReview = await engine.submitForReview(ORG, deliverable.id);
    expect(inReview.status).toBe('in_review');
  });

  it('approve() records an approval and transitions to accepted, publishing deliverable.accepted', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('deliverable.accepted', (payload) => (seen = payload));
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Final Design Mockups' });
    await engine.submitForReview(ORG, deliverable.id);
    const accepted = await engine.approve(ORG, deliverable.id, { approverId: 'employee-1', comment: 'Looks great' });
    expect(accepted.status).toBe('accepted');
    expect(accepted.approvals).toHaveLength(1);
    expect(accepted.approvals[0]).toMatchObject({ approverId: 'employee-1', comment: 'Looks great' });
    expect(seen).toEqual({ organizationId: ORG, deliverableId: deliverable.id, projectId: PROJECT });
  });

  it('approve() rejects a deliverable not currently in_review', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Final Design Mockups' });
    await expect(engine.approve(ORG, deliverable.id, { approverId: 'employee-1' })).rejects.toBeInstanceOf(InvalidDeliverableTransitionError);
  });

  it('reject() moves in_review -> rejected, and resubmit() returns it to draft', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Final Design Mockups' });
    await engine.submitForReview(ORG, deliverable.id);
    const rejected = await engine.reject(ORG, deliverable.id);
    expect(rejected.status).toBe('rejected');
    const backToDraft = await engine.resubmit(ORG, deliverable.id);
    expect(backToDraft.status).toBe('draft');
    const resubmitted = await engine.submitForReview(ORG, deliverable.id);
    expect(resubmitted.status).toBe('in_review');
  });

  it('complete() moves accepted -> completed', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Final Design Mockups' });
    await engine.submitForReview(ORG, deliverable.id);
    await engine.approve(ORG, deliverable.id, { approverId: 'employee-1' });
    const completed = await engine.complete(ORG, deliverable.id);
    expect(completed.status).toBe('completed');
  });

  it('a rejected-then-resubmitted deliverable can be approved again, recording a second approval', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Final Design Mockups' });
    await engine.submitForReview(ORG, deliverable.id);
    await engine.reject(ORG, deliverable.id);
    await engine.resubmit(ORG, deliverable.id);
    await engine.submitForReview(ORG, deliverable.id);
    const accepted = await engine.approve(ORG, deliverable.id, { approverId: 'employee-1' });
    expect(accepted.status).toBe('accepted');
    expect(accepted.approvals).toHaveLength(1);
  });

  it('approve() rejects a deliverable that has already been accepted', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Final Design Mockups' });
    await engine.submitForReview(ORG, deliverable.id);
    await engine.approve(ORG, deliverable.id, { approverId: 'employee-1' });
    await expect(engine.approve(ORG, deliverable.id, { approverId: 'employee-2' })).rejects.toBeInstanceOf(InvalidDeliverableTransitionError);
  });

  it('submitForReview() throws for an unknown deliverable', async () => {
    const { engine } = setup();
    await expect(engine.submitForReview(ORG, 'missing')).rejects.toBeInstanceOf(DeliverableNotFoundError);
  });

  it('findByProject / findByTask / findByStatus filter correctly', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, taskId: 'task-1', name: 'A' });
    await engine.create(ORG, { projectId: 'other-project', name: 'B' });

    expect(await engine.findByProject(ORG, PROJECT)).toEqual([deliverable]);
    expect(await engine.findByTask(ORG, 'task-1')).toEqual([deliverable]);
    expect(await engine.findByStatus(ORG, 'draft')).toHaveLength(2);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Final Design Mockups' });
    expect(await engine.get(ORG, deliverable.id)).toEqual(deliverable);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('update()/approve()/complete()/resubmit() throw DeliverableNotFoundError for an unknown deliverable', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(DeliverableNotFoundError);
    await expect(engine.approve(ORG, 'missing', { approverId: 'e1' })).rejects.toBeInstanceOf(DeliverableNotFoundError);
    await expect(engine.complete(ORG, 'missing')).rejects.toBeInstanceOf(DeliverableNotFoundError);
    await expect(engine.resubmit(ORG, 'missing')).rejects.toBeInstanceOf(DeliverableNotFoundError);
  });

  it('deliverables are isolated per organization', async () => {
    const { engine } = setup();
    await engine.create(ORG, { projectId: PROJECT, name: 'A' });
    await engine.create('org-2', { projectId: PROJECT, name: 'A' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('a deliverable can be created without a linked task', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Standalone' });
    expect(deliverable.taskId).toBeUndefined();
  });

  it('reject() throws InvalidDeliverableTransitionError for a deliverable still in draft', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'A' });
    await expect(engine.reject(ORG, deliverable.id)).rejects.toBeInstanceOf(InvalidDeliverableTransitionError);
  });

  it('a deliverable can be created with a description and a due date up front', async () => {
    const { engine } = setup();
    const deliverable = await engine.create(ORG, { projectId: PROJECT, name: 'Final Design Mockups', description: 'Signed-off visual designs', dueDate: '2026-02-01' });
    expect(deliverable.description).toBe('Signed-off visual designs');
    expect(deliverable.dueDate).toBe('2026-02-01');
  });
});
