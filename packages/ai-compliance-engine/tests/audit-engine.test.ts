import { describe, expect, it } from 'vitest';
import { createComplianceAuditRepository } from '../src/audit-engine/repository.impl.js';
import { canTransitionAudit, createAuditEngine } from '../src/audit-engine/engine.impl.js';
import { createComplianceEventBus } from '../src/events/index.js';
import { ComplianceAuditNotFoundError, InvalidAuditTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createComplianceEventBus()) {
  const repository = createComplianceAuditRepository();
  const engine = createAuditEngine(repository, eventBus);
  return { repository, engine, eventBus };
}

describe('canTransitionAudit (pure)', () => {
  it('allows planned -> in_progress/cancelled', () => {
    expect(canTransitionAudit('planned', 'in_progress')).toBe(true);
    expect(canTransitionAudit('planned', 'cancelled')).toBe(true);
  });

  it('allows in_progress -> completed/cancelled', () => {
    expect(canTransitionAudit('in_progress', 'completed')).toBe(true);
    expect(canTransitionAudit('in_progress', 'cancelled')).toBe(true);
  });

  it('completed and cancelled are terminal', () => {
    expect(canTransitionAudit('completed', 'in_progress')).toBe(false);
    expect(canTransitionAudit('cancelled', 'in_progress')).toBe(false);
  });
});

describe('createAuditEngine — createAuditPlan', () => {
  it('creates a planned audit with no findings', async () => {
    const { engine } = setup();
    const audit = await engine.createAuditPlan(ORG, { title: 'Annual SOC2 Audit', frameworkId: 'fw-1' });
    expect(audit.status).toBe('planned');
    expect(audit.findings).toEqual([]);
  });
});

describe('createAuditEngine — startAudit', () => {
  it('transitions planned -> in_progress, stamps startedAt, and publishes audit.started', async () => {
    const eventBus = createComplianceEventBus();
    const { engine } = setup(eventBus);
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    let seen: unknown;
    eventBus.subscribe('audit.started', (payload) => (seen = payload));
    const started = await engine.startAudit(ORG, audit.id);
    expect(started.status).toBe('in_progress');
    expect(started.startedAt).toBeDefined();
    expect(seen).toEqual({ organizationId: ORG, auditId: audit.id });
  });

  it('throws ComplianceAuditNotFoundError for an unknown audit', async () => {
    const { engine } = setup();
    await expect(engine.startAudit(ORG, 'missing')).rejects.toBeInstanceOf(ComplianceAuditNotFoundError);
  });
});

describe('createAuditEngine — recordFinding', () => {
  it('appends a finding while in_progress', async () => {
    const { engine } = setup();
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    await engine.startAudit(ORG, audit.id);
    const updated = await engine.recordFinding(ORG, audit.id, { severity: 'major', description: 'Access review not performed', recommendation: 'Perform quarterly access reviews' });
    expect(updated.findings).toHaveLength(1);
    expect(updated.findings[0]?.severity).toBe('major');
    expect(updated.findings[0]?.recommendation).toBe('Perform quarterly access reviews');
  });

  it('supports observation-severity findings', async () => {
    const { engine } = setup();
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    await engine.startAudit(ORG, audit.id);
    const updated = await engine.recordFinding(ORG, audit.id, { severity: 'observation', description: 'Minor process gap' });
    expect(updated.findings[0]?.severity).toBe('observation');
  });

  it('links a finding to a corrective action', async () => {
    const { engine } = setup();
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    await engine.startAudit(ORG, audit.id);
    const updated = await engine.recordFinding(ORG, audit.id, { severity: 'critical', description: 'd', correctiveActionId: 'remediation-1' });
    expect(updated.findings[0]?.correctiveActionId).toBe('remediation-1');
  });

  it('rejects recording a finding on a planned (not yet started) audit', async () => {
    const { engine } = setup();
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    await expect(engine.recordFinding(ORG, audit.id, { severity: 'minor', description: 'd' })).rejects.toBeInstanceOf(InvalidAuditTransitionError);
  });

  it('accumulates multiple findings in order', async () => {
    const { engine } = setup();
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    await engine.startAudit(ORG, audit.id);
    await engine.recordFinding(ORG, audit.id, { severity: 'minor', description: 'first' });
    const updated = await engine.recordFinding(ORG, audit.id, { severity: 'major', description: 'second' });
    expect(updated.findings.map((f) => f.description)).toEqual(['first', 'second']);
  });
});

describe('createAuditEngine — completeAudit / cancelAudit', () => {
  it('completeAudit() transitions to completed, stamps completedAt, and publishes audit.completed with the finding count', async () => {
    const eventBus = createComplianceEventBus();
    const { engine } = setup(eventBus);
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    await engine.startAudit(ORG, audit.id);
    await engine.recordFinding(ORG, audit.id, { severity: 'minor', description: 'd' });
    let seen: unknown;
    eventBus.subscribe('audit.completed', (payload) => (seen = payload));
    const completed = await engine.completeAudit(ORG, audit.id);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
    expect(seen).toEqual({ organizationId: ORG, auditId: audit.id, findingCount: 1 });
  });

  it('cancelAudit() transitions to cancelled from planned', async () => {
    const { engine } = setup();
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    const cancelled = await engine.cancelAudit(ORG, audit.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('rejects completing a planned (not started) audit', async () => {
    const { engine } = setup();
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    await expect(engine.completeAudit(ORG, audit.id)).rejects.toBeInstanceOf(InvalidAuditTransitionError);
  });
});

describe('createAuditEngine — get / findByFrameworkId / org scoping', () => {
  it('get() returns null for an unknown audit', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('findByFrameworkId() filters correctly', async () => {
    const { engine } = setup();
    await engine.createAuditPlan(ORG, { title: 'a', frameworkId: 'fw-1' });
    await engine.createAuditPlan(ORG, { title: 'b', frameworkId: 'fw-2' });
    const results = await engine.findByFrameworkId(ORG, 'fw-1');
    expect(results).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    expect(await repository.findById('org-2', audit.id)).toBeNull();
  });

  it('cancelAudit() is also allowed from in_progress', async () => {
    const { engine } = setup();
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    await engine.startAudit(ORG, audit.id);
    const cancelled = await engine.cancelAudit(ORG, audit.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('rejects recording a finding on a cancelled audit', async () => {
    const { engine } = setup();
    const audit = await engine.createAuditPlan(ORG, { title: 't' });
    await engine.cancelAudit(ORG, audit.id);
    await expect(engine.recordFinding(ORG, audit.id, { severity: 'minor', description: 'd' })).rejects.toBeInstanceOf(InvalidAuditTransitionError);
  });
});
