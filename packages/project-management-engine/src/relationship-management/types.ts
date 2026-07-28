/** @module relationship-management/types */
import type { AnalyticsRuntime } from '@lateen-os/analytics-engine';
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import type { FinanceRuntime } from '@lateen-os/finance-engine';
import type { HrRuntime } from '@lateen-os/hr-engine';
import type { InstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import type { InventoryRuntime } from '@lateen-os/inventory-engine';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';

/**
 * Real, optionally-injected collaborators, injected by the
 * composition root. Only the specific slices of each package's
 * public runtime surface this module actually calls are required —
 * never the whole runtime, and never a repository.
 *
 * AI Workforce is intentionally not a direct dependency of this
 * package — combined human + AI workforce context is reached only
 * through HR Engine's own already-integrated
 * `relationships.getAiWorkforceUtilizationContext()`, so this package
 * never duplicates workforce logic and never risks a cyclic
 * dependency.
 */
export interface RelationshipManagementDeps {
  readonly crm?: Pick<CrmRuntime, 'customers'>;
  readonly hr?: Pick<HrRuntime, 'employees' | 'relationships'>;
  readonly finance?: Pick<FinanceRuntime, 'generalLedger'>;
  readonly inventory?: Pick<InventoryRuntime, 'movements'>;
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
  readonly analytics?: Pick<AnalyticsRuntime, 'metrics'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
}
