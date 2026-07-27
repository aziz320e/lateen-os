/** @module relationship-management/types */
import type { BrainQueries } from '@lateen-os/ai-brain';
import type { RuntimeQueries } from '@lateen-os/ai-runtime';
import type { SecurityRuntime } from '@lateen-os/ai-security-engine';
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';

/**
 * Real, optionally-injected collaborators, injected by the composition
 * root. Only the specific slices of each package's public runtime
 * surface this module actually calls are required — never the whole
 * runtime, and never a repository.
 */
export interface RelationshipManagementDeps {
  readonly aiSecurity?: Pick<SecurityRuntime, 'queries'>;
  readonly aiRuntime?: Pick<RuntimeQueries, 'findAgent' | 'findRuntimeState'>;
  readonly aiBrain?: { readonly queries: Pick<BrainQueries, 'explainPlan'> };
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
}
