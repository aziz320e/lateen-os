import { describe, expect, it } from 'vitest';
import { createModelGovernanceRecordRepository } from '../src/model-governance/repository.impl.js';
import { canTransitionModel, createModelGovernanceService } from '../src/model-governance/service.impl.js';
import { InvalidModelTransitionError, ModelGovernanceRecordNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const repository = createModelGovernanceRecordRepository();
  const service = createModelGovernanceService(repository);
  return { repository, service };
}

describe('canTransitionModel (pure)', () => {
  it('allows approved -> blocked and approved -> deprecated', () => {
    expect(canTransitionModel('approved', 'blocked')).toBe(true);
    expect(canTransitionModel('approved', 'deprecated')).toBe(true);
  });

  it('allows blocked -> approved', () => {
    expect(canTransitionModel('blocked', 'approved')).toBe(true);
  });

  it('allows deprecated -> blocked but not deprecated -> approved', () => {
    expect(canTransitionModel('deprecated', 'blocked')).toBe(true);
    expect(canTransitionModel('deprecated', 'approved')).toBe(false);
  });
});

describe('createModelGovernanceService — approveModel', () => {
  it('creates a new approved record for an unseen model', async () => {
    const { service } = setup();
    const record = await service.approveModel(ORG, { modelId: 'gpt-4', modelVersion: '1.0' });
    expect(record.status).toBe('approved');
    expect(record.modelVersion).toBe('1.0');
  });

  it('re-approves a blocked model back to approved', async () => {
    const { service } = setup();
    await service.approveModel(ORG, { modelId: 'gpt-4' });
    await service.blockModel(ORG, 'gpt-4', 'incident');
    const reapproved = await service.approveModel(ORG, { modelId: 'gpt-4' });
    expect(reapproved.status).toBe('approved');
  });

  it('rejects approving a deprecated model directly', async () => {
    const { service } = setup();
    await service.approveModel(ORG, { modelId: 'gpt-3' });
    await service.deprecateModel(ORG, 'gpt-3');
    await expect(service.approveModel(ORG, { modelId: 'gpt-3' })).rejects.toBeInstanceOf(InvalidModelTransitionError);
  });
});

describe('createModelGovernanceService — blockModel / deprecateModel', () => {
  it('blockModel() transitions an approved model to blocked', async () => {
    const { service } = setup();
    await service.approveModel(ORG, { modelId: 'gpt-4' });
    const blocked = await service.blockModel(ORG, 'gpt-4', 'cost overrun');
    expect(blocked.status).toBe('blocked');
    expect(blocked.reason).toBe('cost overrun');
  });

  it('blockModel() throws for an unknown model', async () => {
    const { service } = setup();
    await expect(service.blockModel(ORG, 'missing')).rejects.toBeInstanceOf(ModelGovernanceRecordNotFoundError);
  });

  it('deprecateModel() records a superseding model', async () => {
    const { service } = setup();
    await service.approveModel(ORG, { modelId: 'gpt-3' });
    const deprecated = await service.deprecateModel(ORG, 'gpt-3', { supersededByModelId: 'gpt-4', reason: 'superseded' });
    expect(deprecated.status).toBe('deprecated');
    expect(deprecated.supersededByModelId).toBe('gpt-4');
  });

  it('deprecateModel() throws InvalidModelTransitionError from blocked', async () => {
    const { service } = setup();
    await service.approveModel(ORG, { modelId: 'gpt-3' });
    await service.blockModel(ORG, 'gpt-3');
    await expect(service.deprecateModel(ORG, 'gpt-3')).rejects.toBeInstanceOf(InvalidModelTransitionError);
  });
});

describe('createModelGovernanceService — version tracking', () => {
  it('trackVersion() updates the model version', async () => {
    const { service } = setup();
    await service.approveModel(ORG, { modelId: 'gpt-4', modelVersion: '1.0' });
    const updated = await service.trackVersion(ORG, 'gpt-4', '2.0');
    expect(updated.modelVersion).toBe('2.0');
  });

  it('trackVersion() throws for an unknown model', async () => {
    const { service } = setup();
    await expect(service.trackVersion(ORG, 'missing', '1.0')).rejects.toBeInstanceOf(ModelGovernanceRecordNotFoundError);
  });
});

describe('createModelGovernanceService — get / listByStatus / org scoping', () => {
  it('get() returns null for an unknown model', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('listByStatus() filters correctly', async () => {
    const { service } = setup();
    await service.approveModel(ORG, { modelId: 'gpt-4' });
    await service.approveModel(ORG, { modelId: 'gpt-3' });
    await service.blockModel(ORG, 'gpt-3');
    const approved = await service.listByStatus(ORG, 'approved');
    expect(approved.map((r) => r.modelId)).toEqual(['gpt-4']);
  });

  it('is organization-scoped', async () => {
    const { service } = setup();
    await service.approveModel(ORG, { modelId: 'gpt-4' });
    expect(await service.get('org-2', 'gpt-4')).toBeNull();
  });

  it('re-blocking an already-blocked model is rejected (no self-transition)', async () => {
    const { service } = setup();
    await service.approveModel(ORG, { modelId: 'gpt-4' });
    await service.blockModel(ORG, 'gpt-4');
    await expect(service.blockModel(ORG, 'gpt-4')).rejects.toThrow();
  });

  it('trackVersion() does not change the governance status', async () => {
    const { service } = setup();
    await service.approveModel(ORG, { modelId: 'gpt-4' });
    await service.blockModel(ORG, 'gpt-4');
    const updated = await service.trackVersion(ORG, 'gpt-4', '3.0');
    expect(updated.status).toBe('blocked');
    expect(updated.modelVersion).toBe('3.0');
  });
});
