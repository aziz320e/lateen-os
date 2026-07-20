/**
 * @lateen-os/ai-workforce — AI Workforce Platform
 *
 * Organizational layer above AI Runtime. AI Runtime executes agents;
 * AI Workforce manages digital employees.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as worker from './worker/index.js';
export * as registry from './registry/index.js';
export * as organization from './organization/index.js';
export * as skills from './skills/index.js';
export * as teams from './teams/index.js';
export * as delegation from './delegation/index.js';
export * as collaboration from './collaboration/index.js';
export * as supervision from './supervision/index.js';
export * as goals from './goals/index.js';
export * as performance from './performance/index.js';
export * as availability from './availability/index.js';
export * as notifications from './notifications/index.js';
export * as governance from './governance/index.js';
export * as queries from './queries/index.js';

export type {
  AIWorker,
  WorkerProfile,
  WorkerRole,
  WorkerStatus,
  WorkerCapability,
  WorkerSkill,
  WorkerAvailability,
  WorkerLifecycle,
  WorkerId,
} from './worker/types.js';

export type {
  WorkerRegistry,
  WorkerRegistration,
  WorkerDescriptor,
} from './registry/types.js';

export type { WorkforceOrgUnit, ReportingLine } from './organization/types.js';

export type { SkillDefinition, SkillProficiency } from './skills/types.js';

export type { AITeam, TeamMember, TeamLead } from './teams/types.js';

export type {
  DelegationRequest,
  DelegationRule,
  DelegationResult,
} from './delegation/types.js';

export type {
  Conversation,
  TaskAssignment,
  SharedContext,
} from './collaboration/types.js';

export type { Supervisor, Review, Escalation } from './supervision/types.js';

export type { Goal, Objective, KeyResult } from './goals/types.js';

export type {
  PerformanceMetrics,
  WorkerScore,
  TaskStatistics,
} from './performance/types.js';

export type {
  AvailabilitySchedule,
  AvailabilitySlot,
  AvailabilitySnapshot,
} from './availability/types.js';

export type { WorkforceNotification } from './notifications/types.js';

export type {
  ApprovalRequirement,
  ComplianceCheck,
  AuditRecord,
} from './governance/types.js';

export type { WorkforceQueries } from './queries/workforce-queries.js';

export type { OrganizationId } from './shared/identifiers.js';

export type { WorkerRepository } from './worker/repository.js';
export type { TeamRepository } from './teams/repository.js';
export type { GoalRepository } from './goals/repository.js';
export type { DelegationRequestRepository } from './delegation/repository.js';
export type { TaskAssignmentRepository } from './collaboration/repository.js';
export type { SupervisorRepository } from './supervision/repository.js';
export type { PerformanceMetricsRepository } from './performance/repository.js';
export type { AvailabilityScheduleRepository } from './availability/repository.js';
export type { AuditRecordRepository } from './governance/repository.js';
