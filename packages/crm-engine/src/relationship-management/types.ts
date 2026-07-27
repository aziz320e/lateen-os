/** @module relationship-management/types */
import type { DomainGraphRuntime } from '@lateen-os/domain-graph';
import type { InstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';

/**
 * Optional real collaborators, injected by the composition root. Only the
 * specific slices of each package's public runtime surface this module
 * actually calls are required — never the whole runtime, and never a
 * repository.
 */
export interface RelationshipManagementDeps {
  readonly domainGraph?: Pick<DomainGraphRuntime, 'entities' | 'relationships'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
}
