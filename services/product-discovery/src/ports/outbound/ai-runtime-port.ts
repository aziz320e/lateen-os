/** @module ports/outbound/ai-runtime-port */
import type { RuntimeQueries, Task, TaskPriority } from '@lateen-os/ai-runtime';
import type { OrganizationId, RuntimeAgentId, TaskId } from '../../domain/identifiers.js';
import type { DiscoveryRunId } from '../../domain/identifiers.js';

export interface ScheduleDiscoveryTaskRequest {
  readonly organizationId: OrganizationId;
  readonly runtimeAgentId: RuntimeAgentId;
  readonly runId: DiscoveryRunId;
  readonly title: string;
  readonly priority?: TaskPriority;
}

/** Outbound port to AI Runtime — agent task orchestration. */
export interface AiRuntimePort extends RuntimeQueries {
  scheduleDiscoveryTask(request: ScheduleDiscoveryTaskRequest): Promise<TaskId>;

  getTask(organizationId: OrganizationId, taskId: TaskId): Promise<Task | null>;
}
