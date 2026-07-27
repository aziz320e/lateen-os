import { describe, expect, it } from 'vitest';
import { createComplianceControlRepository } from '../src/control/repository.impl.js';
import { canTransitionControl, createComplianceControlService } from '../src/control/service.impl.js';
import { ComplianceControlNotFoundError, InvalidControlTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const repository = createComplianceControlRepository();
  const service = createComplianceControlService(repository);
  return { repository, service };
}

describe('canTransitionControl (pure)', () => {
  it('allows draft -> approved and draft -> retired', () => {
    expect(canTransitionControl('draft', 'approved')).toBe(true);
    expect(canTransitionControl('draft', 'retired')).toBe(true);
  });

  it('allows approved -> retired', () => {
    expect(canTransitionControl('approved', 'retired')).toBe(true);
  });

  it('retired is terminal', () => {
    expect(canTransitionControl('retired', 'approved')).toBe(false);
    expect(canTransitionControl('retired', 'draft')).toBe(false);
  });
});

describe('createComplianceControlService — create', () => {
  it('creates a draft control with not_implemented by default', async () => {
    const { service } = setup();
    const control = await service.create(ORG, { controlType: 'technical', name: 'Encrypt data at rest' });
    expect(control.status).toBe('draft');
    expect(control.implementationStatus).toBe('not_implemented');
  });

  it('supports all four control types', async () => {
    const { service } = setup();
    const types = ['administrative', 'technical', 'operational', 'physical'] as const;
    for (const controlType of types) {
      const control = await service.create(ORG, { controlType, name: `c-${controlType}` });
      expect(control.controlType).toBe(controlType);
    }
  });

  it('accepts an optional frameworkId, expiresAt, and implementationStatus', async () => {
    const { service } = setup();
    const control = await service.create(ORG, {
      controlType: 'technical',
      name: 'c',
      frameworkId: 'fw-1',
      implementationStatus: 'implemented',
      expiresAt: '2027-01-01T00:00:00.000Z',
    });
    expect(control.frameworkId).toBe('fw-1');
    expect(control.implementationStatus).toBe('implemented');
    expect(control.expiresAt).toBe('2027-01-01T00:00:00.000Z');
  });
});

describe('createComplianceControlService — update', () => {
  it('updates mutable fields', async () => {
    const { service } = setup();
    const control = await service.create(ORG, { controlType: 'technical', name: 'c' });
    const updated = await service.update(ORG, control.id, { name: 'c2', implementationStatus: 'implemented' });
    expect(updated.name).toBe('c2');
    expect(updated.implementationStatus).toBe('implemented');
  });

  it('rejects updating a retired control', async () => {
    const { service } = setup();
    const control = await service.create(ORG, { controlType: 'technical', name: 'c' });
    await service.approve(ORG, control.id);
    await service.retire(ORG, control.id);
    await expect(service.update(ORG, control.id, { name: 'c2' })).rejects.toBeInstanceOf(InvalidControlTransitionError);
  });

  it('throws ComplianceControlNotFoundError for an unknown control', async () => {
    const { service } = setup();
    await expect(service.update(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(ComplianceControlNotFoundError);
  });
});

describe('createComplianceControlService — approve/retire', () => {
  it('approve() transitions draft -> approved', async () => {
    const { service } = setup();
    const control = await service.create(ORG, { controlType: 'technical', name: 'c' });
    const approved = await service.approve(ORG, control.id);
    expect(approved.status).toBe('approved');
  });

  it('retire() transitions approved -> retired', async () => {
    const { service } = setup();
    const control = await service.create(ORG, { controlType: 'technical', name: 'c' });
    await service.approve(ORG, control.id);
    const retired = await service.retire(ORG, control.id);
    expect(retired.status).toBe('retired');
  });

  it('rejects re-approving a retired control', async () => {
    const { service } = setup();
    const control = await service.create(ORG, { controlType: 'technical', name: 'c' });
    await service.approve(ORG, control.id);
    await service.retire(ORG, control.id);
    await expect(service.approve(ORG, control.id)).rejects.toBeInstanceOf(InvalidControlTransitionError);
  });

  it('retire() is allowed directly from draft', async () => {
    const { service } = setup();
    const control = await service.create(ORG, { controlType: 'technical', name: 'c' });
    const retired = await service.retire(ORG, control.id);
    expect(retired.status).toBe('retired');
  });

  it('throws ComplianceControlNotFoundError when approving an unknown control', async () => {
    const { service } = setup();
    await expect(service.approve(ORG, 'missing')).rejects.toBeInstanceOf(ComplianceControlNotFoundError);
  });
});

describe('createComplianceControlService — get / org scoping', () => {
  it('get() returns null for an unknown control', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { service, repository } = setup();
    const control = await service.create(ORG, { controlType: 'technical', name: 'c' });
    expect(await repository.findById('org-2', control.id)).toBeNull();
  });
});
