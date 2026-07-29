/** @module relationship-management/types */
import type { ApiGatewayRuntime } from '@lateen-os/api-gateway';
import type { ComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import type { GovernanceRuntime } from '@lateen-os/ai-governance-engine';
import type { SecurityRuntime } from '@lateen-os/ai-security-engine';
import type { AnalyticsRuntime } from '@lateen-os/analytics-engine';
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { InstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import type { ObservabilityRuntime } from '@lateen-os/observability-engine';

/**
 * Real, optionally-injected collaborators, injected by the
 * composition root. Only the specific slices of each package's
 * public runtime surface this module actually calls are required —
 * never the whole runtime, and never a repository.
 */
export interface RelationshipManagementDeps {
  readonly apiGateway?: Pick<ApiGatewayRuntime, 'queries'>;
  readonly observability?: Pick<ObservabilityRuntime, 'queries'>;
  readonly analytics?: Pick<AnalyticsRuntime, 'queries'>;
  readonly aiSecurity?: Pick<SecurityRuntime, 'queries'>;
  readonly aiGovernance?: Pick<GovernanceRuntime, 'queries'>;
  readonly aiCompliance?: Pick<ComplianceRuntime, 'queries'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
}
