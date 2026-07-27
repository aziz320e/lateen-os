/** @module relationship-management/types */
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import type { InstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import type { MarketingRuntime } from '@lateen-os/marketing-engine';
import type { SalesRuntime } from '@lateen-os/sales-engine';
import type { WorkforceRuntime } from '@lateen-os/ai-workforce';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';

/**
 * Real, optionally-injected collaborators, injected by the composition
 * root. Only the specific slices of each package's public runtime
 * surface this module actually calls are required — never the whole
 * runtime, and never a repository.
 */
export interface RelationshipManagementDeps {
  readonly crm?: Pick<CrmRuntime, 'customers'>;
  readonly sales?: Pick<SalesRuntime, 'opportunities'>;
  readonly marketing?: Pick<MarketingRuntime, 'campaigns'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
  readonly workflow?: Pick<WorkflowRuntime, 'queries'>;
  readonly aiWorkforce?: Pick<WorkforceRuntime, 'lifecycle'>;
}
