/** @module relationship-management/types */
import type { AdminConsoleRuntime } from '@lateen-os/admin-console';
import type { RuntimeQueries } from '@lateen-os/ai-runtime';
import type { AnalyticsRuntime } from '@lateen-os/analytics-engine';
import type { ApiGatewayRuntime } from '@lateen-os/api-gateway';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { InstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import type { ObservabilityRuntime } from '@lateen-os/observability-engine';
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
  readonly apiGateway?: Pick<ApiGatewayRuntime, 'queries'>;
  readonly adminConsole?: Pick<AdminConsoleRuntime, 'organizations'>;
  readonly aiRuntime?: Pick<RuntimeQueries, 'findAgent'>;
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
  readonly analytics?: Pick<AnalyticsRuntime, 'queries'>;
  readonly observability?: Pick<ObservabilityRuntime, 'queries'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
}
