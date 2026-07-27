/** @module timeline/types */
import type { CrmRuntime } from '@lateen-os/crm-engine';
import type { MarketingRuntime } from '@lateen-os/marketing-engine';
import type { SalesRuntime } from '@lateen-os/sales-engine';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';

export type TimelineSource = 'crm' | 'sales' | 'marketing' | 'workflow' | 'message';

/** One unified, deterministic entry in the Communication Timeline. */
export interface TimelineEntry {
  readonly id: string;
  readonly organizationId: string;
  readonly source: TimelineSource;
  readonly entryType: string;
  readonly label: string;
  readonly occurredAt: string;
  readonly referenceId: string;
}

/**
 * Real, optionally-injected read-only collaborators. Only the query
 * surfaces this module actually calls are required — never the whole
 * runtime, and never a repository.
 */
export interface TimelineDeps {
  readonly crm?: Pick<CrmRuntime, 'queries'>;
  readonly sales?: Pick<SalesRuntime, 'queries'>;
  readonly marketing?: Pick<MarketingRuntime, 'queries'>;
  readonly workflow?: Pick<WorkflowRuntime, 'queries'>;
}
