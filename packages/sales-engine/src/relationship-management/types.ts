/** @module relationship-management/types */
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import type { InstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';

/**
 * Real, optionally-injected collaborators, injected by the composition
 * root. Only the specific slices of each package's public runtime
 * surface this module actually calls are required — never the whole
 * runtime, and never a repository.
 */
export interface RelationshipManagementDeps {
  readonly crm?: Pick<CrmRuntime, 'customers' | 'contacts' | 'accounts'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
}
