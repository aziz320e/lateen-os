import { describe, expect, it } from 'vitest';
import { createComplianceFrameworkRepository } from '../src/framework/repository.impl.js';
import { createComplianceControlRepository } from '../src/control/repository.impl.js';
import { createControlMappingRepository } from '../src/control-mapping/repository.impl.js';
import { createEvidenceRepository } from '../src/evidence/repository.impl.js';
import { createGapAnalysisRepository } from '../src/gap-analysis/repository.impl.js';
import { createGapAnalysisEngine, type GapAnalysisDeps } from '../src/gap-analysis/engine.impl.js';
import { ComplianceFrameworkNotFoundError } from '../src/shared/errors.js';
import type { ComplianceControl } from '../src/control/types.js';
import type { ComplianceFramework } from '../src/framework/types.js';

const ORG = 'org-1';
const ASOF = '2026-06-01T00:00:00.000Z';

function baseFramework(overrides: Partial<ComplianceFramework> = {}): ComplianceFramework {
  return {
    id: 'fw-1',
    organizationId: ORG,
    createdAt: ASOF,
    updatedAt: ASOF,
    frameworkCode: 'GDPR',
    name: 'GDPR',
    requiredControlTypes: ['administrative', 'technical', 'operational', 'physical'],
    status: 'draft',
    currentVersion: 1,
    ...overrides,
  };
}

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

function setup(deps: GapAnalysisDeps = {}) {
  const frameworkRepository = createComplianceFrameworkRepository();
  const controlRepository = createComplianceControlRepository();
  const controlMappingRepository = createControlMappingRepository();
  const evidenceRepository = createEvidenceRepository();
  const repository = createGapAnalysisRepository();
  const engine = createGapAnalysisEngine(frameworkRepository, controlRepository, controlMappingRepository, evidenceRepository, repository, deps);
  return { frameworkRepository, controlRepository, controlMappingRepository, evidenceRepository, repository, engine };
}

describe('createGapAnalysisEngine — analyze', () => {
  it('throws ComplianceFrameworkNotFoundError for an unknown framework', async () => {
    const { engine } = setup();
    await expect(engine.analyze(ORG, 'missing')).rejects.toBeInstanceOf(ComplianceFrameworkNotFoundError);
  });

  it('reports every required control type as missing when no controls exist', async () => {
    const { frameworkRepository, engine } = setup();
    await frameworkRepository.save(baseFramework({ requiredControlTypes: ['administrative', 'technical'] }));
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    expect(result.missingControlTypes.sort()).toEqual(['administrative', 'technical'].sort());
  });

  it('does not report a control type as missing once an approved, implemented control of that type exists', async () => {
    const { frameworkRepository, controlRepository, engine } = setup();
    await frameworkRepository.save(baseFramework({ requiredControlTypes: ['technical'] }));
    await controlRepository.save(baseControl());
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    expect(result.missingControlTypes).toEqual([]);
  });

  it('a draft control of the required type still counts as missing', async () => {
    const { frameworkRepository, controlRepository, engine } = setup();
    await frameworkRepository.save(baseFramework({ requiredControlTypes: ['technical'] }));
    await controlRepository.save(baseControl({ status: 'draft' }));
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    expect(result.missingControlTypes).toEqual(['technical']);
  });

  it('detects expired controls', async () => {
    const { frameworkRepository, controlRepository, engine } = setup();
    await frameworkRepository.save(baseFramework());
    await controlRepository.save(baseControl({ expiresAt: '2026-01-01T00:00:00.000Z' }));
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    expect(result.expiredControlIds).toEqual(['control-1']);
  });

  it('detects approved, implemented controls missing evidence', async () => {
    const { frameworkRepository, controlRepository, engine } = setup();
    await frameworkRepository.save(baseFramework());
    await controlRepository.save(baseControl());
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    expect(result.controlsMissingEvidenceIds).toEqual(['control-1']);
  });

  it('does not flag missing evidence once evidence is collected', async () => {
    const { frameworkRepository, controlRepository, evidenceRepository, engine } = setup();
    await frameworkRepository.save(baseFramework());
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
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    expect(result.controlsMissingEvidenceIds).toEqual([]);
  });

  it('returns no orphaned policies when AI Governance Engine is not injected', async () => {
    const { frameworkRepository, engine } = setup();
    await frameworkRepository.save(baseFramework());
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    expect(result.orphanedPolicyIds).toEqual([]);
  });

  it('detects orphaned policies via the real, injected AI Governance Engine queries', async () => {
    const aiGovernance: GapAnalysisDeps['aiGovernance'] = {
      findPolicies: async () => ({
        policies: [{ id: 'policy-1' }, { id: 'policy-2' }] as never,
        total: 2,
      }),
    };
    const { frameworkRepository, controlMappingRepository, engine } = setup({ aiGovernance });
    await frameworkRepository.save(baseFramework());
    await controlMappingRepository.save({
      id: 'mapping-1',
      organizationId: ORG,
      createdAt: ASOF,
      updatedAt: ASOF,
      controlId: 'control-1',
      mappedType: 'policy',
      mappedId: 'policy-1',
    });
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    expect(result.orphanedPolicyIds).toEqual(['policy-2']);
  });

  it('excludes retired controls from expired and missing-evidence checks', async () => {
    const { frameworkRepository, controlRepository, engine } = setup();
    await frameworkRepository.save(baseFramework());
    await controlRepository.save(baseControl({ status: 'retired', expiresAt: '2026-01-01T00:00:00.000Z' }));
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    expect(result.expiredControlIds).toEqual([]);
    expect(result.controlsMissingEvidenceIds).toEqual([]);
  });

  it('does not flag a draft control as missing evidence (only approved, implemented controls are checked)', async () => {
    const { frameworkRepository, controlRepository, engine } = setup();
    await frameworkRepository.save(baseFramework());
    await controlRepository.save(baseControl({ status: 'draft' }));
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    expect(result.controlsMissingEvidenceIds).toEqual([]);
  });

  it('generates a deterministic remediation plan covering every detected gap', async () => {
    const { frameworkRepository, controlRepository, engine } = setup();
    await frameworkRepository.save(baseFramework({ requiredControlTypes: ['administrative'] }));
    await controlRepository.save(baseControl({ expiresAt: '2026-01-01T00:00:00.000Z' }));
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    const gapTypes = result.remediationPlan.map((item) => item.gapType);
    expect(gapTypes).toContain('missing_control');
    expect(gapTypes).toContain('expired_control');
  });

  it('assigns priority critical to expired controls and high to missing controls', async () => {
    const { frameworkRepository, controlRepository, engine } = setup();
    await frameworkRepository.save(baseFramework({ requiredControlTypes: ['administrative'] }));
    await controlRepository.save(baseControl({ expiresAt: '2026-01-01T00:00:00.000Z' }));
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    const expiredItem = result.remediationPlan.find((item) => item.gapType === 'expired_control');
    const missingItem = result.remediationPlan.find((item) => item.gapType === 'missing_control');
    expect(expiredItem?.priority).toBe('critical');
    expect(missingItem?.priority).toBe('high');
  });
});

describe('createGapAnalysisEngine — get / findByFrameworkId / org scoping', () => {
  it('get() returns null for an unknown gap analysis', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('findByFrameworkId() returns every analysis run for a framework', async () => {
    const { frameworkRepository, engine } = setup();
    await frameworkRepository.save(baseFramework());
    await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    const results = await engine.findByFrameworkId(ORG, 'fw-1');
    expect(results).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { frameworkRepository, engine, repository } = setup();
    await frameworkRepository.save(baseFramework());
    const result = await engine.analyze(ORG, 'fw-1', { asOf: ASOF });
    expect(await repository.findById('org-2', result.id)).toBeNull();
  });
});
