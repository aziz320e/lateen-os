/** @module relationship-management/types */
import type { RuntimeQueries } from '@lateen-os/ai-runtime';
import type { ComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import type { GovernanceRuntime } from '@lateen-os/ai-governance-engine';
import type { SecurityRuntime } from '@lateen-os/ai-security-engine';
import type { AnalyticsQueries } from '@lateen-os/analytics-engine';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';

/**
 * Real, optionally-injected collaborators, injected by the composition
 * root. Only the specific slices of each package's public surface this
 * module actually calls are required — never a repository. The
 * Health/Alert/Performance/Audit-Timeline/Snapshot modules already
 * integrate the same 7 packages for their own specific purposes; this
 * layer provides one additional, distinct, real signal per package so
 * every integration point is exercised without duplicating logic.
 */
export interface RelationshipManagementDeps {
  readonly aiRuntime?: Pick<RuntimeQueries, 'findAgent'>;
  readonly workflow?: Pick<WorkflowRuntime, 'queries'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'queries'>;
  readonly aiSecurity?: Pick<SecurityRuntime, 'queries'>;
  readonly aiGovernance?: Pick<GovernanceRuntime, 'queries'>;
  readonly aiCompliance?: Pick<ComplianceRuntime, 'queries'>;
  readonly analyticsEngine?: Pick<AnalyticsQueries, 'findDashboards'>;
}
