/**
 * Real Audience Engine — static and dynamic audiences, deterministic
 * segmentation filters, resolved against the CRM Engine's public query
 * API only (never a repository).
 *
 * @module audience/engine.impl
 */
import type { CrmRuntime } from '@lateen-os/crm-engine';
import { AudienceNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AudienceId, CustomerId, OrganizationId } from '../shared/identifiers.js';
import type { MarketingTag } from '../shared/primitives.js';
import type { AudienceRepository } from './repository.js';
import type { Audience, AudienceFilter, AudienceFilterCandidate, AudienceType } from './types.js';

/** Real, optionally-injected CRM Engine collaborator — only the read query surface this module needs. */
export interface AudienceEngineDeps {
  readonly crm?: Pick<CrmRuntime, 'queries'>;
}

function matchesFilter(candidate: AudienceFilterCandidate, filter: AudienceFilter): boolean {
  const fieldValue =
    filter.field === 'name'
      ? candidate.name
      : filter.field === 'email'
        ? (candidate.email ?? '')
        : filter.field === 'company'
          ? (candidate.company ?? '')
          : undefined;

  if (filter.field === 'tag') {
    return filter.operator === 'eq'
      ? candidate.tags.includes(filter.value)
      : candidate.tags.some((tag) => tag.toLowerCase().includes(filter.value.toLowerCase()));
  }

  const normalizedField = (fieldValue ?? '').toLowerCase();
  const normalizedValue = filter.value.toLowerCase();
  return filter.operator === 'eq' ? normalizedField === normalizedValue : normalizedField.includes(normalizedValue);
}

/** Pure, deterministic segmentation — every filter must match (AND semantics). */
export function applyAudienceFilters<T extends AudienceFilterCandidate>(
  candidates: readonly T[],
  filters: readonly AudienceFilter[],
): readonly T[] {
  if (filters.length === 0) return candidates;
  return candidates.filter((candidate) => filters.every((filter) => matchesFilter(candidate, filter)));
}

export interface CreateAudienceInput {
  readonly name: string;
  readonly audienceType: AudienceType;
  readonly staticMemberIds?: readonly CustomerId[];
  readonly filters?: readonly AudienceFilter[];
}

export interface UpdateAudienceInput {
  readonly name?: string;
  readonly staticMemberIds?: readonly CustomerId[];
  readonly filters?: readonly AudienceFilter[];
  readonly tags?: readonly MarketingTag[];
}

export interface AudienceEngine {
  createAudience(organizationId: OrganizationId, input: CreateAudienceInput): Promise<Audience>;
  updateAudience(organizationId: OrganizationId, audienceId: AudienceId, patch: UpdateAudienceInput): Promise<Audience>;
  archiveAudience(organizationId: OrganizationId, audienceId: AudienceId): Promise<Audience>;
  getAudience(organizationId: OrganizationId, audienceId: AudienceId): Promise<Audience | null>;
  /** Static audiences return their fixed member list; dynamic audiences resolve real CRM Engine customers through `filters`. Empty when CRM Engine is not injected. */
  resolveAudience(organizationId: OrganizationId, audienceId: AudienceId): Promise<readonly CustomerId[]>;
}

/** Creates a real {@link AudienceEngine} backed by an {@link AudienceRepository} and an optional CRM Engine collaborator. */
export function createAudienceEngine(
  repository: AudienceRepository,
  deps: AudienceEngineDeps = {},
  now: () => string = nowIso,
): AudienceEngine {
  async function requireAudience(organizationId: OrganizationId, audienceId: AudienceId): Promise<Audience> {
    const audience = await repository.findById(organizationId, audienceId);
    if (!audience) throw new AudienceNotFoundError(audienceId);
    return audience;
  }

  return {
    async createAudience(organizationId, input) {
      const timestamp = now();
      const audience: Audience = {
        id: generateId('audience'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        audienceType: input.audienceType,
        status: 'active',
        staticMemberIds: input.staticMemberIds,
        filters: input.filters,
      };
      await repository.save(audience);
      return audience;
    },

    async updateAudience(organizationId, audienceId, patch) {
      const audience = await requireAudience(organizationId, audienceId);
      const updated: Audience = {
        ...audience,
        name: patch.name ?? audience.name,
        staticMemberIds: patch.staticMemberIds ?? audience.staticMemberIds,
        filters: patch.filters ?? audience.filters,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async archiveAudience(organizationId, audienceId) {
      const audience = await requireAudience(organizationId, audienceId);
      const updated: Audience = { ...audience, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getAudience(organizationId, audienceId) {
      return repository.findById(organizationId, audienceId);
    },

    async resolveAudience(organizationId, audienceId) {
      const audience = await requireAudience(organizationId, audienceId);
      if (audience.audienceType === 'static') {
        return audience.staticMemberIds ?? [];
      }
      if (!deps.crm) return [];
      const { customers } = await deps.crm.queries.findCustomers({ organizationId });
      const matched = applyAudienceFilters(customers, audience.filters ?? []);
      return matched.map((customer) => customer.id);
    },
  };
}
