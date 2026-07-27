/** @module queries/runtime-types */
import type { OrganizationId, WorkerId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { AvailabilitySnapshot } from '../availability/types.js';
import type { AIWorker } from '../worker/types.js';
import type { SkillDefinition } from '../skills/types.js';

export interface FindAvailableWorkersQuery extends OrganizationScopedQuery {
  readonly roleCode?: string;
}

export interface FindAvailableWorkersResult {
  readonly workers: readonly AIWorker[];
  readonly total: number;
}

export type FindCapabilitiesQuery = OrganizationScopedQuery;

export interface FindCapabilitiesResult {
  readonly skills: readonly SkillDefinition[];
  readonly total: number;
}

export interface FindCapacityQuery {
  readonly organizationId: OrganizationId;
  readonly workerId?: WorkerId;
}

export interface FindCapacityResult {
  readonly snapshots: readonly AvailabilitySnapshot[];
}

export type { OrganizationId, WorkerId };
