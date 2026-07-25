import { describe, expect, it } from 'vitest';
import { createInMemoryRepository } from '../src/repository/in-memory-repository.js';

interface TestEntity {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
}

const ORG_A = 'org-a';
const ORG_B = 'org-b';

describe('createInMemoryRepository', () => {
  it('saves and finds an entity scoped to its organization', async () => {
    const repo = createInMemoryRepository<TestEntity>();
    const entity: TestEntity = { id: '1', organizationId: ORG_A, name: 'Widget' };

    await repo.save(entity);

    await expect(repo.findById(ORG_A, '1')).resolves.toEqual(entity);
  });

  it('returns null when the entity belongs to a different organization', async () => {
    const repo = createInMemoryRepository<TestEntity>();
    await repo.save({ id: '1', organizationId: ORG_A, name: 'Widget' });

    await expect(repo.findById(ORG_B, '1')).resolves.toBeNull();
  });

  it('returns null for an id that does not exist', async () => {
    const repo = createInMemoryRepository<TestEntity>();
    await expect(repo.findById(ORG_A, 'missing')).resolves.toBeNull();
  });

  it('deletes an entity only within the matching organization scope', async () => {
    const repo = createInMemoryRepository<TestEntity>();
    await repo.save({ id: '1', organizationId: ORG_A, name: 'Widget' });

    await repo.delete(ORG_B, '1');
    await expect(repo.findById(ORG_A, '1')).resolves.not.toBeNull();

    await repo.delete(ORG_A, '1');
    await expect(repo.findById(ORG_A, '1')).resolves.toBeNull();
  });

  it('lists all entities, optionally filtered by organization', async () => {
    const repo = createInMemoryRepository<TestEntity>();
    await repo.save({ id: '1', organizationId: ORG_A, name: 'A1' });
    await repo.save({ id: '2', organizationId: ORG_A, name: 'A2' });
    await repo.save({ id: '3', organizationId: ORG_B, name: 'B1' });

    expect(repo.list()).toHaveLength(3);
    expect(repo.list(ORG_A)).toHaveLength(2);
    expect(repo.list(ORG_B)).toHaveLength(1);
  });

  it('clears all stored entities', async () => {
    const repo = createInMemoryRepository<TestEntity>();
    await repo.save({ id: '1', organizationId: ORG_A, name: 'A1' });

    repo.clear();

    expect(repo.list()).toHaveLength(0);
  });

  it('seeds initial data at construction time', () => {
    const repo = createInMemoryRepository<TestEntity>({
      seed: [{ id: '1', organizationId: ORG_A, name: 'Seeded' }],
    });

    expect(repo.list()).toHaveLength(1);
  });

  it('supports a custom organization scope extractor', async () => {
    interface Custom {
      readonly id: string;
      readonly tenant: string;
    }
    const repo = createInMemoryRepository<Custom>({ getOrganizationId: (e) => e.tenant });
    await repo.save({ id: '1', tenant: ORG_A });

    await expect(repo.findById(ORG_A, '1')).resolves.not.toBeNull();
    await expect(repo.findById(ORG_B, '1')).resolves.toBeNull();
  });
});
