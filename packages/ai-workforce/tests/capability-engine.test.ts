import { describe, expect, it } from 'vitest';
import { createWorkerLifecycle } from '../src/worker/lifecycle.impl.js';
import { createWorkerRepository } from '../src/worker/repository.impl.js';
import { createSkillDefinitionRepository } from '../src/skills/repository.impl.js';
import { createCapabilityEngine } from '../src/skills/capability-engine.impl.js';
import type { AIWorker } from '../src/worker/types.js';

const ORG = 'org-1';

async function makeWorker(): Promise<AIWorker> {
  const lifecycle = createWorkerLifecycle(createWorkerRepository());
  return lifecycle.hire({
    organizationId: ORG,
    businessDnaAgentId: 'agent-1',
    runtimeAgentId: 'runtime-agent-1',
    profile: {
      displayName: 'Finance Agent',
      title: 'AI Finance',
      workforceType: 'finance_ai',
      proactiveEnabled: true,
      reactiveEnabled: true,
    },
    skills: [{ workerSkillId: 'ws-1', skillId: 'skill-forecasting', name: 'Forecasting', level: 'advanced', score: '0.85' }],
    capabilities: [{ capabilityId: 'cap-reporting', label: 'Reporting', proficiency: '0.70' }],
    certifications: [{ certificationId: 'cert-1', name: 'Compliance', issuedAt: '2024-01-01T00:00:00.000Z' }],
    toolAccess: [{ toolId: 'tool-ledger', toolName: 'Ledger', scope: 'write', grantedAt: '2024-01-01T00:00:00.000Z' }],
  });
}

describe('createCapabilityEngine', () => {
  it('hasSkill() checks presence and minimum level', async () => {
    const engine = createCapabilityEngine(createSkillDefinitionRepository());
    const worker = await makeWorker();
    expect(engine.hasSkill(worker, 'skill-forecasting')).toBe(true);
    expect(engine.hasSkill(worker, 'skill-forecasting', 'advanced')).toBe(true);
    expect(engine.hasSkill(worker, 'skill-forecasting', 'expert')).toBe(false);
    expect(engine.hasSkill(worker, 'skill-unknown')).toBe(false);
  });

  it('hasCapability() checks presence and minimum proficiency', async () => {
    const engine = createCapabilityEngine(createSkillDefinitionRepository());
    const worker = await makeWorker();
    expect(engine.hasCapability(worker, 'cap-reporting')).toBe(true);
    expect(engine.hasCapability(worker, 'cap-reporting', '0.60')).toBe(true);
    expect(engine.hasCapability(worker, 'cap-reporting', '0.90')).toBe(false);
  });

  it('hasCertification() treats an expired certification as absent', async () => {
    const engine = createCapabilityEngine(createSkillDefinitionRepository());
    const worker = await makeWorker();
    expect(engine.hasCertification(worker, 'cert-1')).toBe(true);

    const expiring: AIWorker = {
      ...worker,
      certifications: [{ certificationId: 'cert-expiring', name: 'Temp', issuedAt: '2024-01-01T00:00:00.000Z', expiresAt: '2024-06-01T00:00:00.000Z' }],
    };
    expect(engine.hasCertification(expiring, 'cert-expiring', '2024-07-01T00:00:00.000Z')).toBe(false);
    expect(engine.hasCertification(expiring, 'cert-expiring', '2024-03-01T00:00:00.000Z')).toBe(true);
  });

  it('hasToolAccess() tolerates admin grants for any requested scope', async () => {
    const engine = createCapabilityEngine(createSkillDefinitionRepository());
    const worker = await makeWorker();
    expect(engine.hasToolAccess(worker, 'tool-ledger', 'write')).toBe(true);
    expect(engine.hasToolAccess(worker, 'tool-ledger', 'admin')).toBe(false);

    const admin: AIWorker = {
      ...worker,
      toolAccess: [{ toolId: 'tool-ledger', toolName: 'Ledger', scope: 'admin', grantedAt: '2024-01-01T00:00:00.000Z' }],
    };
    expect(engine.hasToolAccess(admin, 'tool-ledger', 'read')).toBe(true);
  });

  it('validate() returns ok when every facet is satisfied, err on the first missing facet', async () => {
    const engine = createCapabilityEngine(createSkillDefinitionRepository());
    const worker = await makeWorker();

    const satisfied = engine.validate(worker, { requiredSkillIds: ['skill-forecasting'], requiredCapabilityIds: ['cap-reporting'] });
    expect(satisfied.ok).toBe(true);

    const unsatisfied = engine.validate(worker, { requiredSkillIds: ['skill-missing'] });
    expect(unsatisfied.ok).toBe(false);
    if (!unsatisfied.ok) {
      expect(unsatisfied.error.code).toBe('workforce.capability.missing_skill');
    }
  });

  it('matchScore() is 1.00 for an empty requirement and the fraction of satisfied facets otherwise', async () => {
    const engine = createCapabilityEngine(createSkillDefinitionRepository());
    const worker = await makeWorker();

    expect(engine.matchScore(worker, {})).toBe('1.00');
    expect(engine.matchScore(worker, { requiredSkillIds: ['skill-forecasting'], requiredCapabilityIds: ['cap-missing'] })).toBe('0.50');
  });

  it('listSkillCatalog() delegates to the skill definition repository, organization-scoped', async () => {
    const skillDefinitionRepository = createSkillDefinitionRepository([
      {
        id: 'skill-forecasting',
        organizationId: ORG,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        code: 'forecasting',
        name: 'Forecasting',
        category: 'analytical',
        applicableWorkforceTypes: ['finance_ai'],
        requiredProficiency: '0.50',
      },
    ]);
    const engine = createCapabilityEngine(skillDefinitionRepository);
    const catalog = await engine.listSkillCatalog(ORG);
    expect(catalog).toHaveLength(1);
    expect(await engine.listSkillCatalog('org-2')).toHaveLength(0);
  });
});
