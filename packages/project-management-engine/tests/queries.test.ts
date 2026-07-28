import { describe, expect, it } from 'vitest';
import { createProjectBudgetRepository } from '../src/budget/repository.impl.js';
import { createDeliverableRepository } from '../src/deliverable/repository.impl.js';
import { createMilestoneRepository, createPhaseRepository, createPortfolioRepository, createProgramRepository, createProjectRepository } from '../src/project/repository.impl.js';
import { createProjectQueries } from '../src/queries/project-queries.impl.js';
import { createResourceAssignmentRepository } from '../src/resource/repository.impl.js';
import { createProjectRiskRepository } from '../src/risk/repository.impl.js';
import { createScheduleRepository } from '../src/scheduling/repository.impl.js';
import { createProjectTaskRepository } from '../src/task/repository.impl.js';

const ORG = 'org-1';

function setup() {
  const portfolioRepository = createPortfolioRepository();
  const programRepository = createProgramRepository();
  const projectRepository = createProjectRepository();
  const phaseRepository = createPhaseRepository();
  const milestoneRepository = createMilestoneRepository();
  const taskRepository = createProjectTaskRepository();
  const assignmentRepository = createResourceAssignmentRepository();
  const scheduleRepository = createScheduleRepository();
  const budgetRepository = createProjectBudgetRepository();
  const riskRepository = createProjectRiskRepository();
  const deliverableRepository = createDeliverableRepository();

  const queries = createProjectQueries({
    portfolioRepository,
    programRepository,
    projectRepository,
    phaseRepository,
    milestoneRepository,
    taskRepository,
    assignmentRepository,
    scheduleRepository,
    budgetRepository,
    riskRepository,
    deliverableRepository,
  });

  return {
    queries,
    projectRepository,
    milestoneRepository,
    taskRepository,
    assignmentRepository,
    scheduleRepository,
    budgetRepository,
    riskRepository,
    deliverableRepository,
  };
}

const timestamp = '2026-01-01T00:00:00.000Z';

describe('ProjectQueries — findProjects', () => {
  it('returns all projects for an organization', async () => {
    const { queries, projectRepository } = setup();
    await projectRepository.save({ id: 'p1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, code: 'A', name: 'Alpha', status: 'draft', currentVersion: 1 });
    await projectRepository.save({ id: 'p2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, code: 'B', name: 'Beta', status: 'active', currentVersion: 1 });
    const result = await queries.findProjects({ organizationId: ORG });
    expect(result.total).toBe(2);
  });

  it('filters by status', async () => {
    const { queries, projectRepository } = setup();
    await projectRepository.save({ id: 'p1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, code: 'A', name: 'Alpha', status: 'draft', currentVersion: 1 });
    await projectRepository.save({ id: 'p2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, code: 'B', name: 'Beta', status: 'active', currentVersion: 1 });
    const result = await queries.findProjects({ organizationId: ORG, status: 'active' });
    expect(result.total).toBe(1);
    expect(result.projects[0]?.id).toBe('p2');
  });

  it('filters by portfolioId and programId', async () => {
    const { queries, projectRepository } = setup();
    await projectRepository.save({ id: 'p1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, code: 'A', name: 'Alpha', portfolioId: 'pf1', status: 'draft', currentVersion: 1 });
    await projectRepository.save({ id: 'p2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, code: 'B', name: 'Beta', programId: 'pg1', status: 'draft', currentVersion: 1 });
    expect((await queries.findProjects({ organizationId: ORG, portfolioId: 'pf1' })).total).toBe(1);
    expect((await queries.findProjects({ organizationId: ORG, programId: 'pg1' })).total).toBe(1);
  });

  it('supports offset/limit pagination', async () => {
    const { queries, projectRepository } = setup();
    for (let i = 0; i < 5; i += 1) {
      await projectRepository.save({ id: `p${i}`, organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, code: `C${i}`, name: `P${i}`, status: 'draft', currentVersion: 1 });
    }
    const result = await queries.findProjects({ organizationId: ORG, offset: 2, limit: 2 });
    expect(result.total).toBe(5);
    expect(result.projects).toHaveLength(2);
  });
});

describe('ProjectQueries — findTasks', () => {
  it('filters by project, status, and priority', async () => {
    const { queries, taskRepository } = setup();
    await taskRepository.save({ id: 't1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', title: 'A', priority: 'high', labels: [], dependsOnTaskIds: [], status: 'planned', currentVersion: 1 });
    await taskRepository.save({ id: 't2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p2', title: 'B', priority: 'low', labels: [], dependsOnTaskIds: [], status: 'ready', currentVersion: 1 });

    expect((await queries.findTasks({ organizationId: ORG, projectId: 'p1' })).total).toBe(1);
    expect((await queries.findTasks({ organizationId: ORG, status: 'ready' })).total).toBe(1);
    expect((await queries.findTasks({ organizationId: ORG, priority: 'high' })).total).toBe(1);
  });
});

describe('ProjectQueries — findMilestones', () => {
  it('filters by project and status', async () => {
    const { queries, milestoneRepository } = setup();
    await milestoneRepository.save({ id: 'm1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', name: 'Launch', targetDate: '2026-06-01', status: 'pending' });
    await milestoneRepository.save({ id: 'm2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p2', name: 'Beta Launch', targetDate: '2026-05-01', status: 'reached' });

    expect((await queries.findMilestones({ organizationId: ORG, projectId: 'p1' })).total).toBe(1);
    expect((await queries.findMilestones({ organizationId: ORG, status: 'reached' })).total).toBe(1);
  });
});

describe('ProjectQueries — findAssignments', () => {
  it('filters by project and assignee', async () => {
    const { queries, assignmentRepository } = setup();
    await assignmentRepository.save({ id: 'a1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', assigneeType: 'employee', assigneeId: 'e1', allocationPercentage: 50, status: 'active' });
    await assignmentRepository.save({ id: 'a2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p2', assigneeType: 'ai_worker', assigneeId: 'w1', allocationPercentage: 100, status: 'active' });

    expect((await queries.findAssignments({ organizationId: ORG, projectId: 'p1' })).total).toBe(1);
    expect((await queries.findAssignments({ organizationId: ORG, assigneeId: 'w1' })).total).toBe(1);
    expect((await queries.findAssignments({ organizationId: ORG, projectId: 'p1', assigneeId: 'e1' })).total).toBe(1);
  });
});

describe('ProjectQueries — findSchedules', () => {
  it('filters by project', async () => {
    const { queries, scheduleRepository } = setup();
    await scheduleRepository.save({ id: 's1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', projectStartDate: '2026-01-01', entries: [], isBaseline: false });
    await scheduleRepository.save({ id: 's2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p2', projectStartDate: '2026-01-01', entries: [], isBaseline: false });
    expect((await queries.findSchedules({ organizationId: ORG, projectId: 'p1' })).total).toBe(1);
    expect((await queries.findSchedules({ organizationId: ORG })).total).toBe(2);
  });
});

describe('ProjectQueries — findBudgets', () => {
  it('filters by project and status', async () => {
    const { queries, budgetRepository } = setup();
    await budgetRepository.save({ id: 'b1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', currency: 'USD', plannedBudget: '1000.00', actualCost: '0.00', status: 'active' });
    await budgetRepository.save({ id: 'b2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p2', currency: 'USD', plannedBudget: '2000.00', actualCost: '0.00', status: 'closed' });
    expect((await queries.findBudgets({ organizationId: ORG, projectId: 'p1' })).total).toBe(1);
    expect((await queries.findBudgets({ organizationId: ORG, status: 'closed' })).total).toBe(1);
  });
});

describe('ProjectQueries — findRisks', () => {
  it('filters by project and status', async () => {
    const { queries, riskRepository } = setup();
    await riskRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', title: 'A', probability: 3, impact: 3, score: 9, status: 'identified' });
    await riskRepository.save({ id: 'r2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p2', title: 'B', probability: 5, impact: 5, score: 25, status: 'occurred' });
    expect((await queries.findRisks({ organizationId: ORG, projectId: 'p1' })).total).toBe(1);
    expect((await queries.findRisks({ organizationId: ORG, status: 'occurred' })).total).toBe(1);
  });
});

describe('ProjectQueries — findDeliverables', () => {
  it('filters by project and status', async () => {
    const { queries, deliverableRepository } = setup();
    await deliverableRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', name: 'A', approvals: [], status: 'draft', currentVersion: 1 });
    await deliverableRepository.save({ id: 'd2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p2', name: 'B', approvals: [], status: 'completed', currentVersion: 1 });
    expect((await queries.findDeliverables({ organizationId: ORG, projectId: 'p1' })).total).toBe(1);
    expect((await queries.findDeliverables({ organizationId: ORG, status: 'completed' })).total).toBe(1);
  });
});

describe('ProjectQueries — searchProjects', () => {
  it('finds matches across projects, tasks, milestones, and deliverables, ranked by score', async () => {
    const { queries, projectRepository, taskRepository, milestoneRepository, deliverableRepository } = setup();
    await projectRepository.save({ id: 'p1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, code: 'ALPHA', name: 'Alpha Rollout', status: 'draft', currentVersion: 1 });
    await taskRepository.save({ id: 't1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', title: 'Alpha', priority: 'medium', labels: [], dependsOnTaskIds: [], status: 'planned', currentVersion: 1 });
    await milestoneRepository.save({ id: 'm1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', name: 'Alpha Launch', targetDate: '2026-06-01', status: 'pending' });
    await deliverableRepository.save({ id: 'd1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', name: 'Unrelated', approvals: [], status: 'draft', currentVersion: 1 });

    const result = await queries.searchProjects({ organizationId: ORG, keyword: 'Alpha' });
    // Project (code 'ALPHA' exact match), task (title 'Alpha' exact match), and milestone
    // (substring match) all match; the unrelated deliverable does not.
    expect(result.total).toBe(3);
    expect(result.matches[0]?.score).toBe(3);
    expect(result.matches[1]?.score).toBe(3);
    expect(result.matches[2]?.score).toBe(2);
    // Tied top scores break by id ascending: 'p1' < 't1'.
    expect(result.matches[0]).toMatchObject({ recordType: 'project', id: 'p1', score: 3 });
    expect(result.matches[1]).toMatchObject({ recordType: 'task', id: 't1', score: 3 });
  });

  it('returns no matches for an unrelated keyword', async () => {
    const { queries, projectRepository } = setup();
    await projectRepository.save({ id: 'p1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, code: 'ALPHA', name: 'Alpha Rollout', status: 'draft', currentVersion: 1 });
    const result = await queries.searchProjects({ organizationId: ORG, keyword: 'zzz-nonexistent' });
    expect(result.total).toBe(0);
  });

  it('search results never leak across organizations', async () => {
    const { queries, projectRepository } = setup();
    await projectRepository.save({ id: 'p1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, code: 'UNIQ', name: 'UniqueName', status: 'draft', currentVersion: 1 });
    await projectRepository.save({ id: 'p2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, code: 'UNIQ2', name: 'UniqueName', status: 'draft', currentVersion: 1 });
    const result = await queries.searchProjects({ organizationId: ORG, keyword: 'UniqueName' });
    expect(result.total).toBe(1);
  });

  it('respects a limit on the number of matches returned', async () => {
    const { queries, taskRepository } = setup();
    for (let i = 0; i < 5; i += 1) {
      await taskRepository.save({ id: `t${i}`, organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', title: `Widget ${i}`, priority: 'medium', labels: [], dependsOnTaskIds: [], status: 'planned', currentVersion: 1 });
    }
    const result = await queries.searchProjects({ organizationId: ORG, keyword: 'Widget', limit: 2 });
    expect(result.total).toBe(5);
    expect(result.matches).toHaveLength(2);
  });
});

describe('ProjectQueries — pagination defaults', () => {
  it('findProjects with no offset/limit returns everything', async () => {
    const { queries, projectRepository } = setup();
    await projectRepository.save({ id: 'p1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, code: 'A', name: 'Alpha', status: 'draft', currentVersion: 1 });
    const result = await queries.findProjects({ organizationId: ORG });
    expect(result.projects).toHaveLength(1);
  });

  it('findTasks respects offset without a limit', async () => {
    const { queries, taskRepository } = setup();
    for (let i = 0; i < 3; i += 1) {
      await taskRepository.save({ id: `t${i}`, organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, projectId: 'p1', title: `T${i}`, priority: 'medium', labels: [], dependsOnTaskIds: [], status: 'planned', currentVersion: 1 });
    }
    const result = await queries.findTasks({ organizationId: ORG, offset: 1 });
    expect(result.total).toBe(3);
    expect(result.tasks).toHaveLength(2);
  });
});
