import { describe, expect, it, vi } from 'vitest';
import { EntityCrudService } from '../../src/application/crud-service.js';
import { NoOpEventPublisher } from '../../src/events/noop-publisher.js';

describe('EntityCrudService', () => {
  it('creates entity and publishes domain event', async () => {
    const saved: unknown[] = [];
    const repository = {
      findById: vi.fn(),
      save: vi.fn(async (entity: unknown) => {
        saved.push(entity);
      }),
      delete: vi.fn(),
    };
    const publisher = new NoOpEventPublisher();
    const publishSpy = vi.spyOn(publisher, 'publish');

    const service = new EntityCrudService(repository, publisher, 'branch', true);
    const result = await service.create('org-1' as never, {
      code: 'BR-01',
      name: 'HQ',
      type: 'headquarters',
      status: 'active',
    });

    expect(result.code).toBe('BR-01');
    expect(repository.save).toHaveBeenCalledOnce();
    expect(publishSpy).toHaveBeenCalledOnce();
  });

  it('returns null when updating missing entity', async () => {
    const repository = {
      findById: vi.fn(async () => null),
      save: vi.fn(),
      delete: vi.fn(),
    };
    const service = new EntityCrudService(repository, new NoOpEventPublisher(), 'branch', true);
    const result = await service.update('org-1' as never, 'missing', { name: 'X' });
    expect(result).toBeNull();
  });
});
