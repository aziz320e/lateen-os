import { describe, expect, it } from 'vitest';
import { createAiGovernanceRecordRepository } from '../src/ai-governance/repository.impl.js';
import { createAiGovernanceService } from '../src/ai-governance/service.impl.js';

const ORG = 'org-1';

function setup() {
  const repository = createAiGovernanceRecordRepository();
  const service = createAiGovernanceService(repository);
  return { repository, service };
}

describe('createAiGovernanceService', () => {
  it('approve() creates a new approved record for an ungoverned target', async () => {
    const { service } = setup();
    const record = await service.approve(ORG, { targetType: 'provider', targetId: 'openai' });
    expect(record.status).toBe('approved');
    expect(record.targetType).toBe('provider');
  });

  it('block() creates a new blocked record for an ungoverned target', async () => {
    const { service } = setup();
    const record = await service.block(ORG, { targetType: 'model', targetId: 'gpt-4', reason: 'cost' });
    expect(record.status).toBe('blocked');
    expect(record.reason).toBe('cost');
  });

  it('restrict() creates a new restricted record', async () => {
    const { service } = setup();
    const record = await service.restrict(ORG, { targetType: 'agent', targetId: 'agent-1' });
    expect(record.status).toBe('restricted');
  });

  it('re-deciding the same target updates the existing record rather than creating a new one', async () => {
    const { service, repository } = setup();
    const first = await service.approve(ORG, { targetType: 'worker', targetId: 'worker-1' });
    const second = await service.block(ORG, { targetType: 'worker', targetId: 'worker-1', reason: 'incident' });
    expect(second.id).toBe(first.id);
    expect(second.status).toBe('blocked');
    expect((await repository.findAll(ORG)).filter((r) => r.targetId === 'worker-1')).toHaveLength(1);
  });

  it('getStatus() returns null for an ungoverned target', async () => {
    const { service } = setup();
    expect(await service.getStatus(ORG, 'brain', 'brain-1')).toBeNull();
  });

  it('getStatus() returns the current decision', async () => {
    const { service } = setup();
    await service.approve(ORG, { targetType: 'runtime', targetId: 'runtime-1' });
    expect(await service.getStatus(ORG, 'runtime', 'runtime-1')).toBe('approved');
  });

  it('governs all six target types', async () => {
    const { service } = setup();
    const targetTypes = ['provider', 'model', 'agent', 'worker', 'brain', 'runtime'] as const;
    for (const targetType of targetTypes) {
      const record = await service.approve(ORG, { targetType, targetId: `${targetType}-1` });
      expect(record.targetType).toBe(targetType);
    }
  });

  it('listByTargetType() filters correctly', async () => {
    const { service } = setup();
    await service.approve(ORG, { targetType: 'provider', targetId: 'openai' });
    await service.approve(ORG, { targetType: 'provider', targetId: 'anthropic' });
    await service.approve(ORG, { targetType: 'model', targetId: 'gpt-4' });
    const providers = await service.listByTargetType(ORG, 'provider');
    expect(providers).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { service } = setup();
    await service.approve(ORG, { targetType: 'provider', targetId: 'openai' });
    expect(await service.getStatus('org-2', 'provider', 'openai')).toBeNull();
  });

  it('the same targetId under different target types is governed independently', async () => {
    const { service } = setup();
    await service.approve(ORG, { targetType: 'provider', targetId: 'shared-id' });
    await service.block(ORG, { targetType: 'model', targetId: 'shared-id' });
    expect(await service.getStatus(ORG, 'provider', 'shared-id')).toBe('approved');
    expect(await service.getStatus(ORG, 'model', 'shared-id')).toBe('blocked');
  });

  it('restrict() can be re-decided to approve()', async () => {
    const { service } = setup();
    await service.restrict(ORG, { targetType: 'agent', targetId: 'agent-1' });
    const approved = await service.approve(ORG, { targetType: 'agent', targetId: 'agent-1' });
    expect(approved.status).toBe('approved');
  });
});
