import { describe, expect, it } from 'vitest';
import { createComplianceControlRepository } from '../src/control/repository.impl.js';
import { createEvidenceRepository } from '../src/evidence/repository.impl.js';
import { createComplianceAssessmentRepository } from '../src/assessment/repository.impl.js';
import { computeComplianceScore, computeComplianceStatus, createAssessmentEngine, evaluateControlOutcome } from '../src/assessment/engine.impl.js';
import { createComplianceEventBus } from '../src/events/index.js';
import type { ComplianceControl } from '../src/control/types.js';

const ORG = 'org-1';
const ASOF = '2026-06-01T00:00:00.000Z';

function baseControl(overrides: Partial<ComplianceControl> = {}): ComplianceControl {
  return {
    id: 'control-1',
    organizationId: ORG,
    createdAt: ASOF,
    updatedAt: ASOF,
    frameworkId: 'fw-1',
    controlType: 'technical',
    name: 'c',
    status: 'approved',
    implementationStatus: 'implemented',
    ...overrides,
  };
}

describe('evaluateControlOutcome (pure)', () => {
  it('a draft control is pending regardless of implementation status', () => {
    expect(evaluateControlOutcome(baseControl({ status: 'draft' }), true, ASOF)).toBe('pending');
  });

  it('an approved, implemented control with evidence passes', () => {
    expect(evaluateControlOutcome(baseControl(), true, ASOF)).toBe('passed');
  });

  it('an approved, implemented control without evidence is pending', () => {
    expect(evaluateControlOutcome(baseControl(), false, ASOF)).toBe('pending');
  });

  it('an approved, not_implemented control fails', () => {
    expect(evaluateControlOutcome(baseControl({ implementationStatus: 'not_implemented' }), false, ASOF)).toBe('failed');
  });

  it('an approved, partially_implemented control is pending', () => {
    expect(evaluateControlOutcome(baseControl({ implementationStatus: 'partially_implemented' }), true, ASOF)).toBe('pending');
  });

  it('an expired, approved control fails even if implemented with evidence', () => {
    expect(evaluateControlOutcome(baseControl({ expiresAt: '2026-01-01T00:00:00.000Z' }), true, ASOF)).toBe('failed');
  });

  it('a not-yet-expired control is unaffected', () => {
    expect(evaluateControlOutcome(baseControl({ expiresAt: '2027-01-01T00:00:00.000Z' }), true, ASOF)).toBe('passed');
  });
});

describe('computeComplianceStatus (pure)', () => {
  it('returns not_assessed when there are no controls in scope', () => {
    expect(computeComplianceStatus(0, 0, 0)).toBe('not_assessed');
  });

  it('returns compliant when every control passed', () => {
    expect(computeComplianceStatus(3, 0, 0)).toBe('compliant');
  });

  it('returns non_compliant when any control failed', () => {
    expect(computeComplianceStatus(2, 1, 0)).toBe('non_compliant');
    expect(computeComplianceStatus(0, 1, 5)).toBe('non_compliant');
  });

  it('returns partially_compliant when some controls are pending but none failed', () => {
    expect(computeComplianceStatus(2, 0, 1)).toBe('partially_compliant');
  });
});

describe('computeComplianceScore (pure)', () => {
  it('returns 0 when there are no controls in scope', () => {
    expect(computeComplianceScore(0, 0, 0)).toBe(0);
  });

  it('returns 100 when every control passed', () => {
    expect(computeComplianceScore(4, 0, 0)).toBe(100);
  });

  it('computes a percentage rounded to two decimals', () => {
    expect(computeComplianceScore(1, 1, 1)).toBe(33.33);
  });
});

function setup(eventBus = createComplianceEventBus()) {
  const controlRepository = createComplianceControlRepository();
  const evidenceRepository = createEvidenceRepository();
  const assessmentRepository = createComplianceAssessmentRepository();
  const engine = createAssessmentEngine(controlRepository, evidenceRepository, assessmentRepository, eventBus);
  return { controlRepository, evidenceRepository, assessmentRepository, engine, eventBus };
}

describe('createAssessmentEngine — runAssessment', () => {
  it('returns not_assessed with a score of 0 when the framework has no controls', async () => {
    const { engine } = setup();
    const assessment = await engine.runAssessment(ORG, 'fw-1');
    expect(assessment.status).toBe('not_assessed');
    expect(assessment.score).toBe(0);
  });

  it('excludes retired controls from scope', async () => {
    const { controlRepository, engine } = setup();
    await controlRepository.save(baseControl({ id: 'retired-1', status: 'retired' }));
    const assessment = await engine.runAssessment(ORG, 'fw-1');
    expect(assessment.status).toBe('not_assessed');
  });

  it('classifies a passed control and publishes control.passed', async () => {
    const eventBus = createComplianceEventBus();
    const { controlRepository, evidenceRepository, engine } = setup(eventBus);
    await controlRepository.save(baseControl());
    await evidenceRepository.save({
      id: 'ev-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      controlId: 'control-1',
      source: 'manual',
      attachments: [],
      collectedAt: ASOF,
    });
    let seen: unknown;
    eventBus.subscribe('control.passed', (payload) => (seen = payload));
    const assessment = await engine.runAssessment(ORG, 'fw-1', { asOf: ASOF });
    expect(assessment.status).toBe('compliant');
    expect(assessment.score).toBe(100);
    expect(assessment.passedControlIds).toEqual(['control-1']);
    expect(seen).toEqual({ organizationId: ORG, controlId: 'control-1' });
  });

  it('classifies a failed control and publishes control.failed with reason not_implemented', async () => {
    const eventBus = createComplianceEventBus();
    const { controlRepository, engine } = setup(eventBus);
    await controlRepository.save(baseControl({ implementationStatus: 'not_implemented' }));
    let seen: unknown;
    eventBus.subscribe('control.failed', (payload) => (seen = payload));
    const assessment = await engine.runAssessment(ORG, 'fw-1', { asOf: ASOF });
    expect(assessment.status).toBe('non_compliant');
    expect(assessment.failedControlIds).toEqual(['control-1']);
    expect(seen).toEqual({ organizationId: ORG, controlId: 'control-1', reason: 'not_implemented' });
  });

  it('classifies an expired control as failed with reason expired', async () => {
    const eventBus = createComplianceEventBus();
    const { controlRepository, evidenceRepository, engine } = setup(eventBus);
    await controlRepository.save(baseControl({ expiresAt: '2026-01-01T00:00:00.000Z' }));
    await evidenceRepository.save({
      id: 'ev-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      controlId: 'control-1',
      source: 'manual',
      attachments: [],
      collectedAt: ASOF,
    });
    let seen: unknown;
    eventBus.subscribe('control.failed', (payload) => (seen = payload));
    await engine.runAssessment(ORG, 'fw-1', { asOf: ASOF });
    expect(seen).toEqual({ organizationId: ORG, controlId: 'control-1', reason: 'expired' });
  });

  it('publishes assessment.completed with the score and status', async () => {
    const eventBus = createComplianceEventBus();
    const { controlRepository, evidenceRepository, engine } = setup(eventBus);
    await controlRepository.save(baseControl());
    await evidenceRepository.save({
      id: 'ev-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      controlId: 'control-1',
      source: 'manual',
      attachments: [],
      collectedAt: ASOF,
    });
    let seen: unknown;
    eventBus.subscribe('assessment.completed', (payload) => (seen = payload));
    const assessment = await engine.runAssessment(ORG, 'fw-1', { asOf: ASOF });
    expect(seen).toEqual({ organizationId: ORG, assessmentId: assessment.id, frameworkId: 'fw-1', status: 'compliant', score: 100 });
  });

  it('getLatest() returns the most recently run assessment', async () => {
    const { engine } = setup();
    await engine.runAssessment(ORG, 'fw-1', { asOf: '2026-01-01T00:00:00.000Z' });
    const second = await engine.runAssessment(ORG, 'fw-1', { asOf: '2026-02-01T00:00:00.000Z' });
    const latest = await engine.getLatest(ORG, 'fw-1');
    expect(latest?.id).toBe(second.id);
  });

  it('getLatest() returns null when no assessment has run', async () => {
    const { engine } = setup();
    expect(await engine.getLatest(ORG, 'fw-1')).toBeNull();
  });

  it('get() returns null for an unknown assessment', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { controlRepository, engine } = setup();
    await controlRepository.save(baseControl());
    const assessment = await engine.runAssessment('org-2', 'fw-1', { asOf: ASOF });
    expect(assessment.status).toBe('not_assessed');
  });
});
