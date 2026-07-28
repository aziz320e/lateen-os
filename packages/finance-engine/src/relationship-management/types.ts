/** @module relationship-management/types */
import type { AnalyticsRuntime } from '@lateen-os/analytics-engine';
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import type { InstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import type { SalesRuntime } from '@lateen-os/sales-engine';
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
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
  readonly analytics?: Pick<AnalyticsRuntime, 'kpis'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
}
