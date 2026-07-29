/** @module relationship-management/types */
import type { RuntimeQueries } from '@lateen-os/ai-runtime';
import type { ComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import type { GovernanceRuntime } from '@lateen-os/ai-governance-engine';
import type { SecurityRuntime } from '@lateen-os/ai-security-engine';
import type { AnalyticsRuntime } from '@lateen-os/analytics-engine';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import type { CustomerSuccessRuntime } from '@lateen-os/customer-success-engine';
import type { FinanceRuntime } from '@lateen-os/finance-engine';
import type { HrRuntime } from '@lateen-os/hr-engine';
import type { InventoryRuntime } from '@lateen-os/inventory-engine';
import type { MarketingRuntime } from '@lateen-os/marketing-engine';
import type { ObservabilityRuntime } from '@lateen-os/observability-engine';
import type { ProjectRuntime } from '@lateen-os/project-management-engine';
import type { SalesRuntime } from '@lateen-os/sales-engine';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';

/**
 * Real, optionally-injected collaborators, injected by the
 * composition root. Only the specific slices of each package's
 * public runtime surface this module actually calls are required —
 * never the whole runtime, and never a repository.
 *
 * `aiRuntime` is typed directly against `RuntimeQueries` because
 * `@lateen-os/ai-runtime` has no single `createXRuntime()`
 * composition root — a caller constructs its own `RuntimeQueries` via
 * `createRuntimeQueries(...)` and injects it here.
 */
export interface RelationshipManagementDeps {
  readonly aiRuntime?: Pick<RuntimeQueries, 'findAgent'>;
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
  readonly crm?: Pick<CrmRuntime, 'customers'>;
  readonly sales?: Pick<SalesRuntime, 'opportunities'>;
  readonly marketing?: Pick<MarketingRuntime, 'queries'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
  readonly finance?: Pick<FinanceRuntime, 'chartOfAccounts'>;
  readonly hr?: Pick<HrRuntime, 'employees'>;
  readonly inventory?: Pick<InventoryRuntime, 'catalog'>;
  readonly projects?: Pick<ProjectRuntime, 'projects'>;
  readonly customerSuccess?: Pick<CustomerSuccessRuntime, 'customers'>;
  readonly analytics?: Pick<AnalyticsRuntime, 'metrics'>;
  readonly observability?: Pick<ObservabilityRuntime, 'queries'>;
  readonly aiSecurity?: Pick<SecurityRuntime, 'queries'>;
  readonly aiGovernance?: Pick<GovernanceRuntime, 'queries'>;
  readonly aiCompliance?: Pick<ComplianceRuntime, 'queries'>;
}
