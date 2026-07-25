/**
 * Generic in-memory repository. Every "contracts only" package in the
 * monorepo declares its own identical `Repository<TEntity, TId>` shape
 * (`findById(organizationId, id)`, `save(entity)`, `delete(organizationId, id)`)
 * in a local `shared/repository.ts` file, and would otherwise hand-roll an
 * in-memory Map-backed implementation of it once per aggregate, per package.
 * This helper is that implementation, written once, structurally compatible
 * with every package's local `Repository<TEntity, TId>` interface.
 *
 * @module repository/in-memory-repository
 */

/** Minimal shape every tenant-scoped entity satisfies — deliberately not tied to any one package's `Entity`/`TenantAuditableEntity` type so this stays structurally reusable everywhere. */
export interface IdentifiedEntity<TId extends string = string> {
  readonly id: TId;
}

export interface InMemoryRepositoryOptions<TEntity> {
  /** Extracts the tenant/organization scope from an entity. Defaults to reading `.organizationId`. */
  readonly getOrganizationId?: (entity: TEntity) => string;
  /** Optional seed data, keyed by id, loaded at construction time. */
  readonly seed?: readonly TEntity[];
}

/** A `Repository<TEntity, TId>`-shaped port plus read-all/reset conveniences needed to build query layers on top. */
export interface InMemoryRepository<TEntity extends IdentifiedEntity<TId>, TId extends string = string> {
  findById(organizationId: string, id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
  delete(organizationId: string, id: TId): Promise<void>;
  /** Lists every stored entity, optionally scoped to one organization. */
  list(organizationId?: string): readonly TEntity[];
  clear(): void;
}

function defaultGetOrganizationId(entity: unknown): string {
  return (entity as { organizationId?: string }).organizationId ?? '';
}

/** Creates an in-memory, tenant-scoped repository implementing every package's local `Repository<TEntity, TId>` shape. */
export function createInMemoryRepository<TEntity extends IdentifiedEntity<TId>, TId extends string = string>(
  options: InMemoryRepositoryOptions<TEntity> = {},
): InMemoryRepository<TEntity, TId> {
  const getOrganizationId = options.getOrganizationId ?? defaultGetOrganizationId;
  const store = new Map<TId, TEntity>();

  for (const entity of options.seed ?? []) {
    store.set(entity.id, entity);
  }

  return {
    async findById(organizationId, id) {
      const entity = store.get(id);
      if (!entity || getOrganizationId(entity) !== organizationId) {
        return null;
      }
      return entity;
    },
    async save(entity) {
      store.set(entity.id, entity);
    },
    async delete(organizationId, id) {
      const entity = store.get(id);
      if (entity && getOrganizationId(entity) === organizationId) {
        store.delete(id);
      }
    },
    list(organizationId) {
      const all = Array.from(store.values());
      return organizationId === undefined
        ? all
        : all.filter((entity) => getOrganizationId(entity) === organizationId);
    },
    clear() {
      store.clear();
    },
  };
}
