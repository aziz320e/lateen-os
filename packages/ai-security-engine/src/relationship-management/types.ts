/** @module relationship-management/types */
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';
import type { BrainQueries } from '@lateen-os/ai-brain';

/**
 * Real, optionally-injected collaborators, injected by the composition
 * root. Only the specific slices of each package's public runtime
 * surface this module actually calls are required — never the whole
 * runtime, and never a repository. AI Runtime and AI Provider Hub are
 * integrated separately, by Tool Security and Provider Security
 * respectively — see those modules.
 */
export interface RelationshipManagementDeps {
  readonly aiBrain?: { readonly queries: Pick<BrainQueries, 'explainPlan'> };
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
}
