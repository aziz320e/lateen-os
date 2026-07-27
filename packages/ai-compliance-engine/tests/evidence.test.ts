import { describe, expect, it } from 'vitest';
import { createEvidenceRepository } from '../src/evidence/repository.impl.js';
import { createEvidenceService } from '../src/evidence/service.impl.js';
import { createComplianceEventBus } from '../src/events/index.js';

const ORG = 'org-1';

function setup(eventBus = createComplianceEventBus()) {
  const repository = createEvidenceRepository();
  const service = createEvidenceService(repository, eventBus);
  return { repository, service, eventBus };
}

describe('createEvidenceService — collectEvidence', () => {
  it('collects evidence with a real collection timestamp', async () => {
    const { service } = setup();
    const record = await service.collectEvidence(ORG, { controlId: 'control-1', source: 'manual', description: 'screenshot review' });
    expect(record.controlId).toBe('control-1');
    expect(record.source).toBe('manual');
    expect(record.collectedAt).toBeDefined();
  });

  it('supports all four evidence sources', async () => {
    const { service } = setup();
    const sources = ['manual', 'system', 'integration', 'audit'] as const;
    for (const source of sources) {
      const record = await service.collectEvidence(ORG, { source });
      expect(record.source).toBe(source);
    }
  });

  it('assigns real ids to attachment metadata (no file storage)', async () => {
    const { service } = setup();
    const record = await service.collectEvidence(ORG, {
      source: 'manual',
      attachments: [{ fileName: 'policy.pdf', mimeType: 'application/pdf', sizeBytes: 1024 }],
    });
    expect(record.attachments).toHaveLength(1);
    expect(record.attachments[0]?.id).toBeDefined();
    expect(record.attachments[0]?.fileName).toBe('policy.pdf');
  });

  it('publishes evidence.collected', async () => {
    const eventBus = createComplianceEventBus();
    const { service } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('evidence.collected', (payload) => (seen = payload));
    const record = await service.collectEvidence(ORG, { source: 'system' });
    expect(seen).toEqual({ organizationId: ORG, evidenceId: record.id, source: 'system' });
  });
});

describe('createEvidenceService — lookups', () => {
  it('findByControlId() filters correctly', async () => {
    const { service } = setup();
    await service.collectEvidence(ORG, { controlId: 'control-1', source: 'manual' });
    await service.collectEvidence(ORG, { controlId: 'control-2', source: 'manual' });
    const results = await service.findByControlId(ORG, 'control-1');
    expect(results).toHaveLength(1);
  });

  it('findByFrameworkId() filters correctly', async () => {
    const { service } = setup();
    await service.collectEvidence(ORG, { frameworkId: 'fw-1', source: 'audit' });
    await service.collectEvidence(ORG, { frameworkId: 'fw-2', source: 'audit' });
    const results = await service.findByFrameworkId(ORG, 'fw-1');
    expect(results).toHaveLength(1);
  });

  it('get() returns null for an unknown evidence id', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('an evidence record without attachments has an empty attachments array', async () => {
    const { service } = setup();
    const record = await service.collectEvidence(ORG, { source: 'manual' });
    expect(record.attachments).toEqual([]);
  });

  it('supports multiple attachments per evidence record with distinct ids', async () => {
    const { service } = setup();
    const record = await service.collectEvidence(ORG, {
      source: 'manual',
      attachments: [{ fileName: 'a.pdf' }, { fileName: 'b.pdf' }],
    });
    expect(record.attachments).toHaveLength(2);
    expect(record.attachments[0]!.id).not.toBe(record.attachments[1]!.id);
  });
});

describe('createEvidenceService — getHistory (immutable)', () => {
  it('returns every evidence record sorted oldest first', async () => {
    const { service } = setup();
    await service.collectEvidence(ORG, { source: 'manual' });
    await service.collectEvidence(ORG, { source: 'system' });
    const history = await service.getHistory(ORG);
    expect(history).toHaveLength(2);
    expect(history[0]!.collectedAt <= history[1]!.collectedAt).toBe(true);
  });

  it('exposes no update or delete method — the service surface is append-only', () => {
    const { service } = setup();
    expect((service as Record<string, unknown>)['update']).toBeUndefined();
    expect((service as Record<string, unknown>)['delete']).toBeUndefined();
  });

  it('is organization-scoped', async () => {
    const { service } = setup();
    await service.collectEvidence(ORG, { source: 'manual' });
    expect(await service.getHistory('org-2')).toEqual([]);
  });
});
