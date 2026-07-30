import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { mapDomainError } from '../src/api/v1/common/domain-exception.filter.js';
import { paginateLocal, toPagedResult } from '../src/api/v1/common/pagination.util.js';

describe('Task 4 shared API infrastructure', () => {
  describe('Pagination, Filtering, Sorting', () => {
    const items = [
      { id: 'c', name: 'Charlie', score: 3 },
      { id: 'a', name: 'Alice', score: 1 },
      { id: 'b', name: 'Bob', score: 2 },
    ];

    it('paginateLocal sorts, slices by offset/limit, and reports the pre-slice total', () => {
      const page = paginateLocal(items, { sortBy: 'score', sortDir: 'asc', offset: 0, limit: 2 });
      expect(page.data.map((item) => item.id)).toEqual(['a', 'b']);
      expect(page.meta).toEqual({ total: 3, offset: 0, limit: 2 });
    });

    it('paginateLocal sorts descending when requested', () => {
      const page = paginateLocal(items, { sortBy: 'score', sortDir: 'desc' });
      expect(page.data.map((item) => item.id)).toEqual(['c', 'b', 'a']);
    });

    it('paginateLocal returns everything from offset onward when no limit is given', () => {
      const page = paginateLocal(items, { offset: 1 });
      expect(page.data).toHaveLength(2);
      expect(page.meta.limit).toBe(2);
    });

    it('toPagedResult wraps an already-paginated engine query result without re-slicing', () => {
      const page = toPagedResult(items.slice(0, 1), 3, { offset: 0, limit: 1 });
      expect(page.data).toHaveLength(1);
      expect(page.meta).toEqual({ total: 3, offset: 0, limit: 1 });
    });
  });

  describe('Error Mapping (DomainExceptionFilter)', () => {
    class CustomerNotFoundError extends Error {}
    class DuplicateSkuError extends Error {}
    class InvalidDealStageTransitionError extends Error {}
    class InsufficientStockError extends Error {}
    class ConfigValidationError extends Error {}
    class SomeUnrecognizedError extends Error {}

    it('maps *NotFoundError to 404', () => {
      expect(mapDomainError(new CustomerNotFoundError('missing')).status).toBe(
        HttpStatus.NOT_FOUND,
      );
    });

    it('maps Duplicate* to 409', () => {
      expect(mapDomainError(new DuplicateSkuError('dup')).status).toBe(HttpStatus.CONFLICT);
    });

    it('maps Invalid*Transition* to 409', () => {
      expect(mapDomainError(new InvalidDealStageTransitionError('bad transition')).status).toBe(
        HttpStatus.CONFLICT,
      );
    });

    it('maps Insufficient* to 409', () => {
      expect(mapDomainError(new InsufficientStockError('not enough')).status).toBe(
        HttpStatus.CONFLICT,
      );
    });

    it('maps *ValidationError to 400', () => {
      expect(mapDomainError(new ConfigValidationError('bad config')).status).toBe(
        HttpStatus.BAD_REQUEST,
      );
    });

    it('falls back to 500 for unrecognized errors and non-Error throws', () => {
      expect(mapDomainError(new SomeUnrecognizedError('?')).status).toBe(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mapDomainError('a raw string throw').status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
