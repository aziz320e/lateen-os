/** @module relationship-management/types */
import type { AnalyticsRuntime } from '@lateen-os/analytics-engine';
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import type { CustomerSuccessRuntime } from '@lateen-os/customer-success-engine';
import type { InstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import type { ProjectRuntime } from '@lateen-os/project-management-engine';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';

/**
 * Real, optionally-injected collaborators, injected by the
 * composition root. Only the specific slices of each package's
 * public runtime surface this module actually calls are required —
 * never the whole runtime, and never a repository.
 */
export interface RelationshipManagementDeps {
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
  readonly projects?: Pick<ProjectRuntime, 'projects'>;
  readonly crm?: Pick<CrmRuntime, 'customers'>;
  readonly customerSuccess?: Pick<CustomerSuccessRuntime, 'customers'>;
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
  readonly analytics?: Pick<AnalyticsRuntime, 'metrics'>;
}
