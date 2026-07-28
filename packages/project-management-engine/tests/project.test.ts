import { describe, expect, it } from 'vitest';
import { createProjectEventBus } from '../src/events/index.js';
import {
  canTransitionMilestone,
  canTransitionPhase,
  canTransitionProject,
  createProjectStructureEngine,
} from '../src/project/engine.impl.js';
import {
  createMilestoneRepository,
  createPhaseRepository,
  createPortfolioRepository,
  createProgramRepository,
  createProjectRepository,
} from '../src/project/repository.impl.js';
import {
  DuplicateProjectCodeError,
  InvalidMilestoneTransitionError,
  InvalidPhaseTransitionError,
  InvalidProjectTransitionError,
  MilestoneNotFoundError,
  PhaseNotFoundError,
  PortfolioNotFoundError,
  ProgramNotFoundError,
  ProjectNotFoundError,
} from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createProjectEventBus();
  const engine = createProjectStructureEngine(
    createPortfolioRepository(),
    createProgramRepository(),
    createProjectRepository(),
    createPhaseRepository(),
    createMilestoneRepository(),
    eventBus,
  );
  return { engine, eventBus };
}

describe('canTransitionProject (pure)', () => {
  it('draft can start (active) or be cancelled', () => {
    expect(canTransitionProject('draft', 'active')).toBe(true);
    expect(canTransitionProject('draft', 'cancelled')).toBe(true);
    expect(canTransitionProject('draft', 'completed')).toBe(false);
  });

  it('active can pause, complete, or cancel', () => {
    expect(canTransitionProject('active', 'on_hold')).toBe(true);
    expect(canTransitionProject('active', 'completed')).toBe(true);
    expect(canTransitionProject('active', 'cancelled')).toBe(true);
  });

  it('on_hold can resume or cancel', () => {
    expect(canTransitionProject('on_hold', 'active')).toBe(true);
    expect(canTransitionProject('on_hold', 'cancelled')).toBe(true);
    expect(canTransitionProject('on_hold', 'completed')).toBe(false);
  });

  it('completed and cancelled are terminal except for archive', () => {
    expect(canTransitionProject('completed', 'archived')).toBe(true);
    expect(canTransitionProject('completed', 'active')).toBe(false);
    expect(canTransitionProject('cancelled', 'archived')).toBe(true);
    expect(canTransitionProject('cancelled', 'active')).toBe(false);
  });

  it('archived is a dead end for ordinary transitions', () => {
    expect(canTransitionProject('archived', 'draft')).toBe(false);
    expect(canTransitionProject('archived', 'active')).toBe(false);
  });
});

describe('canTransitionPhase / canTransitionMilestone (pure)', () => {
  it('phase: planned -> active -> completed, no going back', () => {
    expect(canTransitionPhase('planned', 'active')).toBe(true);
    expect(canTransitionPhase('active', 'completed')).toBe(true);
    expect(canTransitionPhase('completed', 'active')).toBe(false);
    expect(canTransitionPhase('planned', 'completed')).toBe(false);
  });

  it('milestone: pending -> reached | missed, both terminal', () => {
    expect(canTransitionMilestone('pending', 'reached')).toBe(true);
    expect(canTransitionMilestone('pending', 'missed')).toBe(true);
    expect(canTransitionMilestone('reached', 'missed')).toBe(false);
    expect(canTransitionMilestone('missed', 'reached')).toBe(false);
  });
});

describe('ProjectStructureEngine — Portfolio', () => {
  it('creates a portfolio at active status', async () => {
    const { engine } = setup();
    const portfolio = await engine.createPortfolio(ORG, { code: 'PF-1', name: 'Digital Transformation' });
    expect(portfolio.status).toBe('active');
    expect(portfolio.code).toBe('PF-1');
  });

  it('updates a portfolio', async () => {
    const { engine } = setup();
    const portfolio = await engine.createPortfolio(ORG, { code: 'PF-1', name: 'Original' });
    const updated = await engine.updatePortfolio(ORG, portfolio.id, { name: 'Renamed' });
    expect(updated.name).toBe('Renamed');
  });

  it('archives and restores a portfolio', async () => {
    const { engine } = setup();
    const portfolio = await engine.createPortfolio(ORG, { code: 'PF-1', name: 'Digital Transformation' });
    const archived = await engine.archivePortfolio(ORG, portfolio.id);
    expect(archived.status).toBe('archived');
    const restored = await engine.restorePortfolio(ORG, portfolio.id);
    expect(restored.status).toBe('active');
  });

  it('lists all portfolios for an organization', async () => {
    const { engine } = setup();
    await engine.createPortfolio(ORG, { code: 'PF-1', name: 'A' });
    await engine.createPortfolio(ORG, { code: 'PF-2', name: 'B' });
    const portfolios = await engine.listPortfolios(ORG);
    expect(portfolios).toHaveLength(2);
  });

  it('getPortfolio returns null for unknown id', async () => {
    const { engine } = setup();
    expect(await engine.getPortfolio(ORG, 'missing')).toBeNull();
  });
});

describe('ProjectStructureEngine — Program', () => {
  it('creates a program optionally under a portfolio', async () => {
    const { engine } = setup();
    const portfolio = await engine.createPortfolio(ORG, { code: 'PF-1', name: 'Digital Transformation' });
    const program = await engine.createProgram(ORG, { code: 'PG-1', name: 'Cloud Migration', portfolioId: portfolio.id });
    expect(program.portfolioId).toBe(portfolio.id);
  });

  it('findProgramsByPortfolio returns only matching programs', async () => {
    const { engine } = setup();
    const portfolio = await engine.createPortfolio(ORG, { code: 'PF-1', name: 'A' });
    const other = await engine.createPortfolio(ORG, { code: 'PF-2', name: 'B' });
    await engine.createProgram(ORG, { code: 'PG-1', name: 'X', portfolioId: portfolio.id });
    await engine.createProgram(ORG, { code: 'PG-2', name: 'Y', portfolioId: other.id });
    const programs = await engine.findProgramsByPortfolio(ORG, portfolio.id);
    expect(programs).toHaveLength(1);
    expect(programs[0]?.code).toBe('PG-1');
  });

  it('archives and restores a program', async () => {
    const { engine } = setup();
    const program = await engine.createProgram(ORG, { code: 'PG-1', name: 'Cloud Migration' });
    const archived = await engine.archiveProgram(ORG, program.id);
    expect(archived.status).toBe('archived');
    const restored = await engine.restoreProgram(ORG, program.id);
    expect(restored.status).toBe('active');
  });

  it('updates a program', async () => {
    const { engine } = setup();
    const program = await engine.createProgram(ORG, { code: 'PG-1', name: 'Original' });
    const updated = await engine.updateProgram(ORG, program.id, { name: 'Renamed' });
    expect(updated.name).toBe('Renamed');
  });
});

describe('ProjectStructureEngine — Project lifecycle', () => {
  it('creates a project at draft status', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    expect(project.status).toBe('draft');
    expect(project.currentVersion).toBe(1);
  });

  it('publishes project.created on create', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('project.created', (payload) => (seen = payload));
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    expect(seen).toEqual({ organizationId: ORG, projectId: project.id, name: 'Website Revamp' });
  });

  it('rejects a duplicate project code within the same organization', async () => {
    const { engine } = setup();
    await engine.create(ORG, { code: 'PRJ-1', name: 'First' });
    await expect(engine.create(ORG, { code: 'PRJ-1', name: 'Second' })).rejects.toBeInstanceOf(DuplicateProjectCodeError);
  });

  it('allows the same code across different organizations', async () => {
    const { engine } = setup();
    await engine.create(ORG, { code: 'PRJ-1', name: 'First' });
    await expect(engine.create('org-2', { code: 'PRJ-1', name: 'Second' })).resolves.toBeTruthy();
  });

  it('start() moves draft -> active and publishes project.started', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('project.started', (payload) => (seen = payload));
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const started = await engine.start(ORG, project.id);
    expect(started.status).toBe('active');
    expect(seen).toEqual({ organizationId: ORG, projectId: project.id });
  });

  it('pause() moves active -> on_hold, resume() moves back to active', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    await engine.start(ORG, project.id);
    const paused = await engine.pause(ORG, project.id);
    expect(paused.status).toBe('on_hold');
    const resumed = await engine.resume(ORG, project.id);
    expect(resumed.status).toBe('active');
  });

  it('complete() moves active -> completed, stamps actualEndDate, and publishes project.completed', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('project.completed', (payload) => (seen = payload));
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    await engine.start(ORG, project.id);
    const completed = await engine.complete(ORG, project.id);
    expect(completed.status).toBe('completed');
    expect(completed.actualEndDate).toBeDefined();
    expect(seen).toEqual({ organizationId: ORG, projectId: project.id });
  });

  it('cancel() is allowed from draft, active, and on_hold, and publishes project.cancelled with a reason', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('project.cancelled', (payload) => (seen = payload));
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const cancelled = await engine.cancel(ORG, project.id, { reason: 'Budget cut' });
    expect(cancelled.status).toBe('cancelled');
    expect(seen).toEqual({ organizationId: ORG, projectId: project.id, reason: 'Budget cut' });
  });

  it('rejects an invalid transition (completed -> active)', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    await engine.start(ORG, project.id);
    await engine.complete(ORG, project.id);
    await expect(engine.start(ORG, project.id)).rejects.toBeInstanceOf(InvalidProjectTransitionError);
  });

  it('archive() then restore() returns a project to its pre-archive status', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    await engine.start(ORG, project.id);
    await engine.pause(ORG, project.id);
    const archived = await engine.archive(ORG, project.id);
    expect(archived.status).toBe('archived');
    expect(archived.statusBeforeArchive).toBe('on_hold');
    const restored = await engine.restore(ORG, project.id);
    expect(restored.status).toBe('on_hold');
  });

  it('restore() rejects a project that is not archived', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    await expect(engine.restore(ORG, project.id)).rejects.toBeInstanceOf(InvalidProjectTransitionError);
  });

  it('update() rejects an archived project', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    await engine.archive(ORG, project.id);
    await expect(engine.update(ORG, project.id, { name: 'New Name' })).rejects.toBeInstanceOf(InvalidProjectTransitionError);
  });

  it('update() changes mutable fields and bumps currentVersion', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Original' });
    const updated = await engine.update(ORG, project.id, { name: 'Renamed', targetEndDate: '2026-12-31' });
    expect(updated.name).toBe('Renamed');
    expect(updated.targetEndDate).toBe('2026-12-31');
    expect(updated.currentVersion).toBe(2);
  });

  it('findByProgram / findByPortfolio / findByStatus / findByCode all filter correctly', async () => {
    const { engine } = setup();
    const portfolio = await engine.createPortfolio(ORG, { code: 'PF-1', name: 'A' });
    const program = await engine.createProgram(ORG, { code: 'PG-1', name: 'B', portfolioId: portfolio.id });
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'X', portfolioId: portfolio.id, programId: program.id });
    await engine.create(ORG, { code: 'PRJ-2', name: 'Y' });

    expect(await engine.findByProgram(ORG, program.id)).toEqual([project]);
    expect(await engine.findByPortfolio(ORG, portfolio.id)).toEqual([project]);
    expect(await engine.findByStatus(ORG, 'draft')).toHaveLength(2);
    expect(await engine.findByCode(ORG, 'PRJ-1')).toEqual(project);
    expect(await engine.findByCode(ORG, 'missing')).toBeNull();
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    expect(await engine.get(ORG, project.id)).toEqual(project);
    expect(await engine.list(ORG)).toHaveLength(1);
  });
});

describe('ProjectStructureEngine — Phase', () => {
  it('creates a phase at planned status', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const phase = await engine.createPhase(ORG, { projectId: project.id, name: 'Design', sequence: 1 });
    expect(phase.status).toBe('planned');
  });

  it('startPhase() and completePhase() progress the lifecycle', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const phase = await engine.createPhase(ORG, { projectId: project.id, name: 'Design', sequence: 1 });
    const started = await engine.startPhase(ORG, phase.id);
    expect(started.status).toBe('active');
    const completed = await engine.completePhase(ORG, phase.id);
    expect(completed.status).toBe('completed');
  });

  it('completePhase() rejects a phase that has not started', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const phase = await engine.createPhase(ORG, { projectId: project.id, name: 'Design', sequence: 1 });
    await expect(engine.completePhase(ORG, phase.id)).rejects.toBeInstanceOf(InvalidPhaseTransitionError);
  });

  it('listPhasesForProject returns only that project’s phases, ordered by insertion', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const other = await engine.create(ORG, { code: 'PRJ-2', name: 'Other' });
    await engine.createPhase(ORG, { projectId: project.id, name: 'Design', sequence: 1 });
    await engine.createPhase(ORG, { projectId: project.id, name: 'Build', sequence: 2 });
    await engine.createPhase(ORG, { projectId: other.id, name: 'Design', sequence: 1 });
    expect(await engine.listPhasesForProject(ORG, project.id)).toHaveLength(2);
  });
});

describe('ProjectStructureEngine — Milestone', () => {
  it('creates a milestone at pending status', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const milestone = await engine.createMilestone(ORG, { projectId: project.id, name: 'Launch', targetDate: '2026-06-01' });
    expect(milestone.status).toBe('pending');
  });

  it('reachMilestone() stamps actualDate and transitions to reached', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const milestone = await engine.createMilestone(ORG, { projectId: project.id, name: 'Launch', targetDate: '2026-06-01' });
    const reached = await engine.reachMilestone(ORG, milestone.id, '2026-06-02');
    expect(reached.status).toBe('reached');
    expect(reached.actualDate).toBe('2026-06-02');
  });

  it('missMilestone() transitions to missed', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const milestone = await engine.createMilestone(ORG, { projectId: project.id, name: 'Launch', targetDate: '2026-06-01' });
    const missed = await engine.missMilestone(ORG, milestone.id);
    expect(missed.status).toBe('missed');
  });

  it('rejects re-reaching an already-reached milestone', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const milestone = await engine.createMilestone(ORG, { projectId: project.id, name: 'Launch', targetDate: '2026-06-01' });
    await engine.reachMilestone(ORG, milestone.id, '2026-06-02');
    await expect(engine.reachMilestone(ORG, milestone.id, '2026-06-03')).rejects.toBeInstanceOf(InvalidMilestoneTransitionError);
  });

  it('listMilestonesForProject filters by project', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const other = await engine.create(ORG, { code: 'PRJ-2', name: 'Other' });
    await engine.createMilestone(ORG, { projectId: project.id, name: 'Launch', targetDate: '2026-06-01' });
    await engine.createMilestone(ORG, { projectId: other.id, name: 'Launch', targetDate: '2026-06-01' });
    expect(await engine.listMilestonesForProject(ORG, project.id)).toHaveLength(1);
  });

  it('milestone can optionally be scoped to a phase', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const phase = await engine.createPhase(ORG, { projectId: project.id, name: 'Design', sequence: 1 });
    const milestone = await engine.createMilestone(ORG, { projectId: project.id, phaseId: phase.id, name: 'Design Sign-off', targetDate: '2026-03-01' });
    expect(milestone.phaseId).toBe(phase.id);
  });

  it('getMilestone() returns null for unknown id', async () => {
    const { engine } = setup();
    expect(await engine.getMilestone(ORG, 'missing')).toBeNull();
  });
});

describe('ProjectStructureEngine — not-found guards', () => {
  it('updatePortfolio()/archivePortfolio()/restorePortfolio() throw PortfolioNotFoundError for an unknown id', async () => {
    const { engine } = setup();
    await expect(engine.updatePortfolio(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(PortfolioNotFoundError);
    await expect(engine.archivePortfolio(ORG, 'missing')).rejects.toBeInstanceOf(PortfolioNotFoundError);
    await expect(engine.restorePortfolio(ORG, 'missing')).rejects.toBeInstanceOf(PortfolioNotFoundError);
  });

  it('updateProgram()/archiveProgram()/restoreProgram() throw ProgramNotFoundError for an unknown id', async () => {
    const { engine } = setup();
    await expect(engine.updateProgram(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(ProgramNotFoundError);
    await expect(engine.archiveProgram(ORG, 'missing')).rejects.toBeInstanceOf(ProgramNotFoundError);
    await expect(engine.restoreProgram(ORG, 'missing')).rejects.toBeInstanceOf(ProgramNotFoundError);
  });

  it('update()/start()/pause()/resume()/complete()/cancel()/archive() throw ProjectNotFoundError for an unknown project', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(engine.start(ORG, 'missing')).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(engine.pause(ORG, 'missing')).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(engine.resume(ORG, 'missing')).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(engine.complete(ORG, 'missing')).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(engine.cancel(ORG, 'missing')).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(engine.archive(ORG, 'missing')).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it('startPhase()/completePhase() throw PhaseNotFoundError for an unknown phase', async () => {
    const { engine } = setup();
    await expect(engine.startPhase(ORG, 'missing')).rejects.toBeInstanceOf(PhaseNotFoundError);
    await expect(engine.completePhase(ORG, 'missing')).rejects.toBeInstanceOf(PhaseNotFoundError);
  });

  it('reachMilestone()/missMilestone() throw MilestoneNotFoundError for an unknown milestone', async () => {
    const { engine } = setup();
    await expect(engine.reachMilestone(ORG, 'missing', '2026-01-01')).rejects.toBeInstanceOf(MilestoneNotFoundError);
    await expect(engine.missMilestone(ORG, 'missing')).rejects.toBeInstanceOf(MilestoneNotFoundError);
  });
});

describe('ProjectStructureEngine — organization scoping', () => {
  it('projects, portfolios, and programs never leak across organizations', async () => {
    const { engine } = setup();
    await engine.create(ORG, { code: 'PRJ-1', name: 'Org 1 Project' });
    await engine.create('org-2', { code: 'PRJ-1', name: 'Org 2 Project' });
    await engine.createPortfolio(ORG, { code: 'PF-1', name: 'Org 1 Portfolio' });
    await engine.createPortfolio('org-2', { code: 'PF-1', name: 'Org 2 Portfolio' });

    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
    expect(await engine.listPortfolios(ORG)).toHaveLength(1);
    expect(await engine.listPortfolios('org-2')).toHaveLength(1);
  });

  it('archive() on a draft project (never started) restores back to draft', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const archived = await engine.archive(ORG, project.id);
    expect(archived.statusBeforeArchive).toBe('draft');
    const restored = await engine.restore(ORG, project.id);
    expect(restored.status).toBe('draft');
  });

  it('archive() on a cancelled project restores back to cancelled', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    await engine.cancel(ORG, project.id);
    const archived = await engine.archive(ORG, project.id);
    expect(archived.statusBeforeArchive).toBe('cancelled');
    const restored = await engine.restore(ORG, project.id);
    expect(restored.status).toBe('cancelled');
  });

  it('findByStatus distinguishes cancelled from completed projects', async () => {
    const { engine } = setup();
    const created = await engine.create(ORG, { code: 'PRJ-1', name: 'A' });
    const cancelled = await engine.cancel(ORG, created.id);
    const other = await engine.create(ORG, { code: 'PRJ-2', name: 'B' });
    await engine.start(ORG, other.id);
    const completed = await engine.complete(ORG, other.id);

    expect(await engine.findByStatus(ORG, 'cancelled')).toEqual([cancelled]);
    expect(await engine.findByStatus(ORG, 'completed')).toEqual([completed]);
  });

  it('listPortfolios / listPrograms return an empty list for an organization with none', async () => {
    const { engine } = setup();
    expect(await engine.listPortfolios(ORG)).toEqual([]);
    expect(await engine.listPrograms(ORG)).toEqual([]);
  });

  it('listPhasesForProject / listMilestonesForProject return an empty list for a project with none', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    expect(await engine.listPhasesForProject(ORG, project.id)).toEqual([]);
    expect(await engine.listMilestonesForProject(ORG, project.id)).toEqual([]);
  });

  it('phases preserve their given sequence number', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Website Revamp' });
    const design = await engine.createPhase(ORG, { projectId: project.id, name: 'Design', sequence: 1 });
    const build = await engine.createPhase(ORG, { projectId: project.id, name: 'Build', sequence: 2 });
    expect(design.sequence).toBe(1);
    expect(build.sequence).toBe(2);
  });

  it('getProgram / getProject return null for unknown ids', async () => {
    const { engine } = setup();
    expect(await engine.getProgram(ORG, 'missing')).toBeNull();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('a project may omit portfolioId, programId, customerId, and ownerId entirely', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Standalone Project' });
    expect(project.portfolioId).toBeUndefined();
    expect(project.programId).toBeUndefined();
    expect(project.customerId).toBeUndefined();
    expect(project.ownerId).toBeUndefined();
  });

  it('create() accepts an explicit customerId and ownerId', async () => {
    const { engine } = setup();
    const project = await engine.create(ORG, { code: 'PRJ-1', name: 'Client Project', customerId: 'customer-1', ownerId: 'employee-1' });
    expect(project.customerId).toBe('customer-1');
    expect(project.ownerId).toBe('employee-1');
  });

  it('programs can be created without a portfolio and later remain independent', async () => {
    const { engine } = setup();
    const program = await engine.createProgram(ORG, { code: 'PG-1', name: 'Standalone Program' });
    expect(program.portfolioId).toBeUndefined();
  });
});
