/** @module relationship-management/types */
import type { WorkforceQueries } from '@lateen-os/ai-workforce';
import type { AnalyticsRuntime } from '@lateen-os/analytics-engine';
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { FinanceRuntime } from '@lateen-os/finance-engine';
import type { InstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';

/**
 * Real, optionally-injected collaborators, injected by the composition
 * root. Only the specific slices of each package's public runtime
 * surface this module actually calls are required — never the whole
 * runtime, and never a repository.
 */
export interface RelationshipManagementDeps {
  readonly finance?: Pick<FinanceRuntime, 'tax'>;
  readonly aiWorkforce?: Pick<WorkforceQueries, 'findWorkers'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
  readonly analytics?: Pick<AnalyticsRuntime, 'kpis'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
}
