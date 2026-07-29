/**
 * Real Request Context engine — one tracked record per request,
 * keyed by a real correlation id (`crypto.randomUUID()`), moving
 * through `in_flight -> completed | rejected`.
 *
 * @module context/engine.impl
 */
import { randomUUID } from 'node:crypto';
import { RequestContextNotFoundError } from '../shared/errors.js';
import { nowIso } from '../shared/id.js';
import type { OrganizationId, RequestContextId } from '../shared/identifiers.js';
import type { HttpMethod } from '../shared/primitives.js';
import type { RequestContextRepository } from './repository.js';
import type { RequestContext } from './types.js';

/** Generates a real RFC 4122 correlation id — no counter, no predictable sequence. */
export function generateCorrelationId(): string {
  return randomUUID();
}

export interface CreateRequestContextInput {
  readonly method: HttpMethod;
  readonly path: string;
  readonly principalId?: string;
}

export interface RequestContextEngine {
  createContext(organizationId: OrganizationId, input: CreateRequestContextInput): Promise<RequestContext>;
  completeContext(organizationId: OrganizationId, contextId: RequestContextId, statusCode: number): Promise<RequestContext>;
  rejectContext(organizationId: OrganizationId, contextId: RequestContextId, reason: string): Promise<RequestContext>;
  get(organizationId: OrganizationId, contextId: RequestContextId): Promise<RequestContext | null>;
  list(organizationId: OrganizationId): Promise<readonly RequestContext[]>;
}

/** Creates a real {@link RequestContextEngine}. */
export function createRequestContextEngine(repository: RequestContextRepository, now: () => string = nowIso): RequestContextEngine {
  async function requireContext(organizationId: OrganizationId, contextId: RequestContextId): Promise<RequestContext> {
    const context = await repository.findById(organizationId, contextId);
    if (!context) throw new RequestContextNotFoundError(contextId);
    return context;
  }

  return {
    async createContext(organizationId, input) {
      const timestamp = now();
      const context: RequestContext = {
        id: generateCorrelationId(),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        method: input.method,
        path: input.path,
        principalId: input.principalId,
        startedAt: timestamp,
        status: 'in_flight',
      };
      await repository.save(context);
      return context;
    },

    async completeContext(organizationId, contextId, statusCode) {
      const context = await requireContext(organizationId, contextId);
      const updated: RequestContext = { ...context, status: 'completed', statusCode, completedAt: now(), updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async rejectContext(organizationId, contextId, reason) {
      const context = await requireContext(organizationId, contextId);
      const updated: RequestContext = { ...context, status: 'rejected', rejectionReason: reason, completedAt: now(), updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, contextId) {
      return repository.findById(organizationId, contextId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
