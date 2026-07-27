import { describe, expect, it } from 'vitest';
import { createComplianceFrameworkRepository, createComplianceFrameworkVersionRepository } from '../src/framework/repository.impl.js';
import { canTransitionFramework, createComplianceFrameworkEngine } from '../src/framework/engine.impl.js';
import { createComplianceEventBus } from '../src/events/index.js';
import { ComplianceFrameworkNotFoundError, InvalidFrameworkTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createComplianceEventBus()) {
  const repository = createComplianceFrameworkRepository();
  const versionRepository = createComplianceFrameworkVersionRepository();
  const engine = createComplianceFrameworkEngine(repository, versionRepository, eventBus);
  return { repository, versionRepository, engine, eventBus };
}

describe('canTransitionFramework (pure)', () => {
  it('allows draft -> active', () => {
    expect(canTransitionFramework('draft', 'active')).toBe(true);
  });

  it('allows active -> inactive', () => {
    expect(canTransitionFramework('active', 'inactive')).toBe(true);
  });

  it('allows any non-archived status -> archived', () => {
    expect(canTransitionFramework('draft', 'archived')).toBe(true);
    expect(canTransitionFramework('active', 'archived')).toBe(true);
    expect(canTransitionFramework('inactive', 'archived')).toBe(true);
  });

  it('rejects archived -> anything — restore() is a distinct operation', () => {
    expect(canTransitionFramework('archived', 'draft')).toBe(false);
    expect(canTransitionFramework('archived', 'active')).toBe(false);
    expect(canTransitionFramework('archived', 'inactive')).toBe(false);
  });

  it('rejects draft -> inactive', () => {
    expect(canTransitionFramework('draft', 'inactive')).toBe(false);
  });
});

describe('createComplianceFrameworkEngine — create', () => {
  it('creates a draft framework at version 1 with default required control types', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'GDPR Baseline' });
    expect(framework.status).toBe('draft');
    expect(framework.currentVersion).toBe(1);
    expect(framework.requiredControlTypes).toEqual(['administrative', 'technical', 'operational', 'physical']);
  });

  it('accepts custom required control types', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'SOC2', name: 'SOC2', requiredControlTypes: ['technical'] });
    expect(framework.requiredControlTypes).toEqual(['technical']);
  });

  it('publishes framework.created', async () => {
    const eventBus = createComplianceEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('framework.created', (payload) => (seen = payload));
    const framework = await engine.create(ORG, { frameworkCode: 'ISO27001', name: 'ISO' });
    expect(seen).toEqual({ organizationId: ORG, frameworkId: framework.id, frameworkCode: 'ISO27001' });
  });

  it('snapshots version 1 on create', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'HIPAA', name: 'HIPAA' });
    const history = await engine.getVersionHistory(ORG, framework.id);
    expect(history).toHaveLength(1);
  });

  it('supports all eight compliance frameworks', async () => {
    const { engine } = setup();
    const codes = ['GDPR', 'ISO27001', 'SOC2', 'HIPAA', 'PCI_DSS', 'NIST_CSF', 'ISO42001', 'EU_AI_ACT'] as const;
    for (const frameworkCode of codes) {
      const framework = await engine.create(ORG, { frameworkCode, name: `n-${frameworkCode}` });
      expect(framework.frameworkCode).toBe(frameworkCode);
    }
  });
});

describe('createComplianceFrameworkEngine — update', () => {
  it('bumps version and snapshots on update', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    const updated = await engine.update(ORG, framework.id, { name: 'n2' });
    expect(updated.currentVersion).toBe(2);
    const history = await engine.getVersionHistory(ORG, framework.id);
    expect(history).toHaveLength(2);
  });

  it('publishes framework.updated', async () => {
    const eventBus = createComplianceEventBus();
    const { engine } = setup(eventBus);
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    let seen: unknown;
    eventBus.subscribe('framework.updated', (payload) => (seen = payload));
    await engine.update(ORG, framework.id, { name: 'n2' });
    expect(seen).toEqual({ organizationId: ORG, frameworkId: framework.id });
  });

  it('rejects updating an archived framework', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    await engine.archive(ORG, framework.id);
    await expect(engine.update(ORG, framework.id, { name: 'n2' })).rejects.toBeInstanceOf(InvalidFrameworkTransitionError);
  });

  it('throws ComplianceFrameworkNotFoundError for an unknown framework', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(ComplianceFrameworkNotFoundError);
  });
});

describe('createComplianceFrameworkEngine — activate/deactivate', () => {
  it('activate() moves draft -> active', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    const activated = await engine.activate(ORG, framework.id);
    expect(activated.status).toBe('active');
  });

  it('deactivate() moves active -> inactive', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    await engine.activate(ORG, framework.id);
    const deactivated = await engine.deactivate(ORG, framework.id);
    expect(deactivated.status).toBe('inactive');
  });

  it('rejects activate() on an archived framework', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    await engine.archive(ORG, framework.id);
    await expect(engine.activate(ORG, framework.id)).rejects.toBeInstanceOf(InvalidFrameworkTransitionError);
  });
});

describe('createComplianceFrameworkEngine — archive/restore', () => {
  it('archive() stamps statusBeforeArchive', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    await engine.activate(ORG, framework.id);
    const archived = await engine.archive(ORG, framework.id);
    expect(archived.status).toBe('archived');
    expect(archived.statusBeforeArchive).toBe('active');
  });

  it('restore() returns to the status held before archiving', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    await engine.activate(ORG, framework.id);
    await engine.deactivate(ORG, framework.id);
    await engine.archive(ORG, framework.id);
    const restored = await engine.restore(ORG, framework.id);
    expect(restored.status).toBe('inactive');
  });

  it('restore() defaults to draft when archived directly from draft', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    await engine.archive(ORG, framework.id);
    const restored = await engine.restore(ORG, framework.id);
    expect(restored.status).toBe('draft');
  });

  it('rejects restore() on a non-archived framework', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    await expect(engine.restore(ORG, framework.id)).rejects.toBeInstanceOf(InvalidFrameworkTransitionError);
  });
});

describe('createComplianceFrameworkEngine — get / version history / org scoping', () => {
  it('get() returns null for an unknown framework', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('getVersionHistory() is sorted ascending by version', async () => {
    const { engine } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    await engine.update(ORG, framework.id, { name: 'n2' });
    await engine.update(ORG, framework.id, { name: 'n3' });
    const history = await engine.getVersionHistory(ORG, framework.id);
    expect(history.map((v) => v.version)).toEqual([1, 2, 3]);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const framework = await engine.create(ORG, { frameworkCode: 'GDPR', name: 'n' });
    expect(await repository.findById('org-2', framework.id)).toBeNull();
  });
});
