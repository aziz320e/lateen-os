import { describe, expect, it } from 'vitest';
import { canTransitionDepartment, createOrganizationStructureEngine } from '../src/department/engine.impl.js';
import { createDepartmentRepository } from '../src/department/repository.impl.js';
import { DepartmentNotFoundError, InvalidDepartmentTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const repository = createDepartmentRepository();
  const engine = createOrganizationStructureEngine(repository);
  return { repository, engine };
}

describe('canTransitionDepartment (pure)', () => {
  it('allows active -> archived', () => {
    expect(canTransitionDepartment('active', 'archived')).toBe(true);
  });

  it('rejects any transition out of archived', () => {
    expect(canTransitionDepartment('archived', 'active')).toBe(false);
  });
});

describe('OrganizationStructureEngine — create', () => {
  it('creates an active department', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    expect(department.status).toBe('active');
    expect(department.currentVersion).toBe(1);
  });

  it('supports all three unit types', async () => {
    const { engine } = setup();
    const types = ['department', 'business_unit', 'division'] as const;
    for (const unitType of types) {
      const department = await engine.create(ORG, { code: `c-${unitType}`, name: unitType, unitType });
      expect(department.unitType).toBe(unitType);
    }
  });

  it('supports a parentDepartmentId for hierarchy', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { code: 'ORG', name: 'Organization', unitType: 'division' });
    const child = await engine.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department', parentDepartmentId: parent.id });
    expect(child.parentDepartmentId).toBe(parent.id);
  });

  it('supports an optional managerId', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department', managerId: 'employee-1' });
    expect(department.managerId).toBe('employee-1');
  });
});

describe('OrganizationStructureEngine — update', () => {
  it('bumps version on update', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'n', unitType: 'department' });
    const updated = await engine.update(ORG, department.id, { name: 'n2' });
    expect(updated.currentVersion).toBe(2);
    expect(updated.name).toBe('n2');
  });

  it('updates managerId', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'n', unitType: 'department' });
    const updated = await engine.update(ORG, department.id, { managerId: 'employee-2' });
    expect(updated.managerId).toBe('employee-2');
  });

  it('rejects updating an archived department', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'n', unitType: 'department' });
    await engine.archive(ORG, department.id);
    await expect(engine.update(ORG, department.id, { name: 'n2' })).rejects.toBeInstanceOf(InvalidDepartmentTransitionError);
  });

  it('throws DepartmentNotFoundError for an unknown department', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(DepartmentNotFoundError);
  });
});

describe('OrganizationStructureEngine — archive/restore', () => {
  it('archive() moves active -> archived', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'n', unitType: 'department' });
    const archived = await engine.archive(ORG, department.id);
    expect(archived.status).toBe('archived');
  });

  it('restore() moves archived -> active', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'n', unitType: 'department' });
    await engine.archive(ORG, department.id);
    const restored = await engine.restore(ORG, department.id);
    expect(restored.status).toBe('active');
  });

  it('rejects archiving an already-archived department', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'n', unitType: 'department' });
    await engine.archive(ORG, department.id);
    await expect(engine.archive(ORG, department.id)).rejects.toBeInstanceOf(InvalidDepartmentTransitionError);
  });

  it('rejects restoring a non-archived department', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'n', unitType: 'department' });
    await expect(engine.restore(ORG, department.id)).rejects.toBeInstanceOf(InvalidDepartmentTransitionError);
  });
});

describe('OrganizationStructureEngine — hierarchy (reporting hierarchy)', () => {
  it('getChildren() returns direct children only', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { code: 'ORG', name: 'Org', unitType: 'division' });
    const child1 = await engine.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department', parentDepartmentId: parent.id });
    const child2 = await engine.create(ORG, { code: 'SALES', name: 'Sales', unitType: 'department', parentDepartmentId: parent.id });
    const grandchild = await engine.create(ORG, { code: 'BE', name: 'Backend', unitType: 'department', parentDepartmentId: child1.id });
    const children = await engine.getChildren(ORG, parent.id);
    expect(children.map((c) => c.id).sort()).toEqual([child1.id, child2.id].sort());
    expect(children.some((c) => c.id === grandchild.id)).toBe(false);
  });

  it('getDescendants() returns every depth', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { code: 'ORG', name: 'Org', unitType: 'division' });
    const child = await engine.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department', parentDepartmentId: parent.id });
    const grandchild = await engine.create(ORG, { code: 'BE', name: 'Backend', unitType: 'department', parentDepartmentId: child.id });
    const descendants = await engine.getDescendants(ORG, parent.id);
    expect(descendants.map((d) => d.id).sort()).toEqual([child.id, grandchild.id].sort());
  });

  it('getAncestors() walks up to the root', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { code: 'ORG', name: 'Org', unitType: 'division' });
    const child = await engine.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department', parentDepartmentId: parent.id });
    const grandchild = await engine.create(ORG, { code: 'BE', name: 'Backend', unitType: 'department', parentDepartmentId: child.id });
    const ancestors = await engine.getAncestors(ORG, grandchild.id);
    expect(ancestors.map((a) => a.id)).toEqual([parent.id, child.id]);
  });

  it('getAncestors() is empty for a root department', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ORG', name: 'Org', unitType: 'division' });
    expect(await engine.getAncestors(ORG, department.id)).toEqual([]);
  });

  it('findByManager() finds departments headed by a given employee', async () => {
    const { engine } = setup();
    await engine.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department', managerId: 'employee-1' });
    const found = await engine.findByManager(ORG, 'employee-1');
    expect(found).toHaveLength(1);
  });
});

describe('OrganizationStructureEngine — business_unit and division lifecycle', () => {
  it('a business_unit follows the same archive/restore lifecycle as a department', async () => {
    const { engine } = setup();
    const unit = await engine.create(ORG, { code: 'BU1', name: 'Manufacturing', unitType: 'business_unit' });
    const archived = await engine.archive(ORG, unit.id);
    expect(archived.status).toBe('archived');
    const restored = await engine.restore(ORG, unit.id);
    expect(restored.status).toBe('active');
  });
});

describe('OrganizationStructureEngine — findByUnitType/findByStatus repository filters', () => {
  it('findByUnitType() filters correctly', async () => {
    const { engine, repository } = setup();
    await engine.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    await engine.create(ORG, { code: 'GRP', name: 'Group', unitType: 'division' });
    expect(await repository.findByUnitType(ORG, 'division')).toHaveLength(1);
  });

  it('findByStatus() filters correctly', async () => {
    const { engine, repository } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    await engine.archive(ORG, department.id);
    expect(await repository.findByStatus(ORG, 'archived')).toHaveLength(1);
    expect(await repository.findByStatus(ORG, 'active')).toHaveLength(0);
  });
});

describe('OrganizationStructureEngine — update preserves unrelated fields', () => {
  it('preserves description and unitType when only name is updated', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'n', unitType: 'business_unit', description: 'Original desc' });
    const updated = await engine.update(ORG, department.id, { name: 'n2' });
    expect(updated.description).toBe('Original desc');
    expect(updated.unitType).toBe('business_unit');
  });

  it('update() can clear no fields but change description', async () => {
    const { engine } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'n', unitType: 'department' });
    const updated = await engine.update(ORG, department.id, { description: 'New desc' });
    expect(updated.description).toBe('New desc');
    expect(updated.name).toBe('n');
  });
});

describe('OrganizationStructureEngine — restore reactivates archived hierarchy members independently', () => {
  it('restoring a parent does not affect a still-archived child', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { code: 'ORG', name: 'Org', unitType: 'division' });
    const child = await engine.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department', parentDepartmentId: parent.id });
    await engine.archive(ORG, parent.id);
    await engine.archive(ORG, child.id);
    const restoredParent = await engine.restore(ORG, parent.id);
    expect(restoredParent.status).toBe('active');
    const stillChild = await engine.get(ORG, child.id);
    expect(stillChild?.status).toBe('archived');
  });
});

describe('OrganizationStructureEngine — get/list/org scoping', () => {
  it('get() returns null for an unknown department', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every department for the organization', async () => {
    const { engine } = setup();
    await engine.create(ORG, { code: 'ENG', name: 'a', unitType: 'department' });
    await engine.create(ORG, { code: 'SALES', name: 'b', unitType: 'department' });
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const department = await engine.create(ORG, { code: 'ENG', name: 'a', unitType: 'department' });
    expect(await repository.findById('org-2', department.id)).toBeNull();
  });
});
