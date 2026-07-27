/** @module relationship-management/types */
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { DecisionQueries } from '@lateen-os/decision-engine';
import type { DomainGraphQueries } from '@lateen-os/domain-graph';
import type { IntelligenceQueries } from '@lateen-os/intelligence-engine';
import type { KnowledgeRuntimeQueries } from '@lateen-os/institutional-memory';
import type { WorkforceQueries } from '@lateen-os/ai-workforce';

/**
 * Real, optionally-injected collaborators, injected by the composition
 * root. Only the specific slices of each package's public surface this
 * module actually calls are required — never a repository. The 8
 * category analytics modules (revenue, sales, marketing, communication,
 * workflow, security, governance, compliance) integrate their own
 * sibling packages directly; this layer owns the remaining 6.
 *
 * `institutionalMemory` is typed against `KnowledgeRuntimeQueries` (not
 * the standalone `MemoryQueries` port) because `createInstitutionalMemoryRuntime().queries`
 * — the package's real, constructible composition-root output — returns
 * a `KnowledgeRuntimeQueries`; `MemoryQueries` has no real factory wired
 * to it in this codebase.
 */
export interface RelationshipManagementDeps {
  readonly institutionalMemory?: Pick<KnowledgeRuntimeQueries, 'findKnowledge'>;
  readonly domainGraph?: Pick<DomainGraphQueries, 'graphStatistics'>;
  readonly decisionEngine?: Pick<DecisionQueries, 'findPendingApprovals'>;
  readonly intelligenceEngine?: Pick<IntelligenceQueries, 'findBusinessOpportunities'>;
  readonly aiWorkforce?: Pick<WorkforceQueries, 'findWorkers'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
}
