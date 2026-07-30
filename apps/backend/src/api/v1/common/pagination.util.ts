export interface PagedResult<T> {
  readonly data: readonly T[];
  readonly meta: { readonly total: number; readonly offset: number; readonly limit: number };
}

interface SortableQuery {
  readonly sortBy?: string;
  readonly sortDir?: 'asc' | 'desc';
}

interface PageableQuery extends SortableQuery {
  readonly offset?: number;
  readonly limit?: number;
}

function sortItems<T>(
  items: readonly T[],
  sortBy?: string,
  sortDir: 'asc' | 'desc' = 'asc',
): readonly T[] {
  if (!sortBy) return items;
  const dir = sortDir === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortBy];
    const bv = (b as Record<string, unknown>)[sortBy];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    return av > bv ? dir : -dir;
  });
}

/**
 * For engine methods with no built-in pagination (`list()`/`findByX()`,
 * which always return the full array) — applies a consistent
 * offset/limit/sort locally, over data already fully loaded through the
 * real runtime. Never touches a repository; the array was already
 * produced by the engine's own public API.
 */
export function paginateLocal<T>(items: readonly T[], query: PageableQuery): PagedResult<T> {
  const sorted = sortItems(items, query.sortBy, query.sortDir);
  const offset = query.offset ?? 0;
  const limit = query.limit;
  const page = limit === undefined ? sorted.slice(offset) : sorted.slice(offset, offset + limit);
  return { data: page, meta: { total: sorted.length, offset, limit: limit ?? page.length } };
}

/** For results that already went through an engine's own `queries.findX` (offset/limit/total already applied server-side) — wraps into the standard envelope shape without re-slicing. */
export function toPagedResult<T>(
  items: readonly T[],
  total: number,
  query: { offset?: number; limit?: number },
): PagedResult<T> {
  return {
    data: items,
    meta: { total, offset: query.offset ?? 0, limit: query.limit ?? items.length },
  };
}
