import { describe, expect, it } from 'vitest';
import { createControlMappingRepository } from '../src/control-mapping/repository.impl.js';
import { createControlMappingService } from '../src/control-mapping/service.impl.js';

const ORG = 'org-1';

function setup() {
  const repository = createControlMappingRepository();
  const service = createControlMappingService(repository);
  return { repository, service };
}

describe('createControlMappingService — mapControl', () => {
  it('creates a mapping', async () => {
    const { service } = setup();
    const mapping = await service.mapControl(ORG, { controlId: 'control-1', mappedType: 'policy', mappedId: 'policy-1' });
    expect(mapping.controlId).toBe('control-1');
    expect(mapping.mappedType).toBe('policy');
  });

  it('supports all five mapped record types', async () => {
    const { service } = setup();
    const types = ['policy', 'governance_rule', 'security_control', 'workflow', 'business_process'] as const;
    for (const mappedType of types) {
      const mapping = await service.mapControl(ORG, { controlId: 'control-1', mappedType, mappedId: `${mappedType}-1` });
      expect(mapping.mappedType).toBe(mappedType);
    }
  });
});

describe('createControlMappingService — unmapControl', () => {
  it('removes a mapping', async () => {
    const { service } = setup();
    const mapping = await service.mapControl(ORG, { controlId: 'control-1', mappedType: 'policy', mappedId: 'policy-1' });
    await service.unmapControl(ORG, mapping.id);
    const remaining = await service.findMappingsForControl(ORG, 'control-1');
    expect(remaining).toEqual([]);
  });
});

describe('createControlMappingService — lookups', () => {
  it('findMappingsForControl() returns every mapping for a control', async () => {
    const { service } = setup();
    await service.mapControl(ORG, { controlId: 'control-1', mappedType: 'policy', mappedId: 'policy-1' });
    await service.mapControl(ORG, { controlId: 'control-1', mappedType: 'workflow', mappedId: 'workflow-1' });
    await service.mapControl(ORG, { controlId: 'control-2', mappedType: 'policy', mappedId: 'policy-2' });
    const mappings = await service.findMappingsForControl(ORG, 'control-1');
    expect(mappings).toHaveLength(2);
  });

  it('findControlIdsForMappedRecord() returns every control mapped to a given record', async () => {
    const { service } = setup();
    await service.mapControl(ORG, { controlId: 'control-1', mappedType: 'policy', mappedId: 'policy-1' });
    await service.mapControl(ORG, { controlId: 'control-2', mappedType: 'policy', mappedId: 'policy-1' });
    const controlIds = await service.findControlIdsForMappedRecord(ORG, 'policy', 'policy-1');
    expect(controlIds.sort()).toEqual(['control-1', 'control-2'].sort());
  });

  it('findControlIdsForMappedRecord() returns an empty list for an unmapped record', async () => {
    const { service } = setup();
    expect(await service.findControlIdsForMappedRecord(ORG, 'policy', 'unmapped')).toEqual([]);
  });

  it('findMappingsForControl() returns an empty list for a control with no mappings', async () => {
    const { service } = setup();
    expect(await service.findMappingsForControl(ORG, 'unmapped-control')).toEqual([]);
  });

  it('the same control can be mapped to multiple mapped types simultaneously', async () => {
    const { service } = setup();
    await service.mapControl(ORG, { controlId: 'control-1', mappedType: 'policy', mappedId: 'policy-1' });
    await service.mapControl(ORG, { controlId: 'control-1', mappedType: 'governance_rule', mappedId: 'rule-1' });
    const mappings = await service.findMappingsForControl(ORG, 'control-1');
    expect(mappings.map((m) => m.mappedType).sort()).toEqual(['governance_rule', 'policy'].sort());
  });

  it('is organization-scoped', async () => {
    const { service, repository } = setup();
    const mapping = await service.mapControl(ORG, { controlId: 'control-1', mappedType: 'policy', mappedId: 'policy-1' });
    expect(await repository.findById('org-2', mapping.id)).toBeNull();
  });
});
