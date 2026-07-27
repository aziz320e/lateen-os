# AI Workforce — Package Architecture

> **Lateen OS Architecture v1.0 (Locked)** — Layer 4: AI Workforce

## Purpose

`@lateen-os/ai-workforce` is the **canonical organizational layer for digital employees** in Lateen OS. It sits above `@lateen-os/ai-runtime` and defines how AI workers are registered, organized, delegated, supervised, measured, and governed.

The Worker Lifecycle, Worker Registry, Capability Engine, Capacity Engine, Assignment Engine, Performance Engine, query layer, and event bus are **real, deterministic, in-memory implementations** — see `runtime.ts`'s `createWorkforceRuntime()` for the composition root, and each module's `*.impl.ts` files. The remaining modules (organization, teams, delegation, collaboration conversations, supervision, goals, notifications, governance) remain models and ports only — no LLM integration, persistence, UI, or API.

---

## Layer relationship

```
Business DNA (identity & org)
        │
        ▼
   AI Workforce ── manages digital employees
        │
        ▼
   AI Runtime ── executes agents & tasks
        │
        ▼
   Decision Engine ── approves recommendations
```

Every AI worker links:

| Field | Package |
| ----- | ------- |
| `businessDnaAgentId` | `@lateen-os/business-dna` |
| `runtimeAgentId` | `@lateen-os/ai-runtime` |

---

## Module map

| Module | Types | Repository | Real? |
| ------ | ----- | ---------- | ----- |
| `worker` | AIWorker, WorkerProfile, WorkerRole, WorkerStatus, WorkerCapability, WorkerSkill, WorkerAvailability, WorkerCertification, ToolAccessGrant | WorkerRepository | ✅ `WorkerLifecycleService` (hire/activate/suspend/resume/retire) |
| `registry` | WorkerRegistry, WorkerRegistration, WorkerDescriptor | WorkerRegistrationRepository, WorkerRegistryRepository | ✅ `WorkerRegistryService` |
| `organization` | WorkforceOrgUnit, ReportingLine | WorkforceOrgUnitRepository | contracts only |
| `skills` | SkillDefinition, SkillProficiency, WorkerCertification, ToolAccessGrant, CapabilityRequirement | SkillDefinitionRepository | ✅ `CapabilityEngine` |
| `teams` | AITeam, TeamMember, TeamLead | TeamRepository, TeamMemberRepository | contracts only |
| `delegation` | DelegationRequest, DelegationRule, DelegationResult | DelegationRequestRepository, DelegationRuleRepository | contracts only |
| `collaboration` | Conversation, TaskAssignment, SharedContext | ConversationRepository, TaskAssignmentRepository, SharedContextRepository | `TaskAssignment`/`TaskAssignmentRepository` real; Conversation/SharedContext contracts only |
| `supervision` | Supervisor, Review, Escalation | SupervisorRepository, ReviewRepository, EscalationRepository | contracts only |
| `goals` | Goal, Objective, KeyResult | GoalRepository, ObjectiveRepository, KeyResultRepository | contracts only |
| `performance` | PerformanceMetrics, WorkerScore, TaskStatistics | PerformanceMetricsRepository | ✅ `PerformanceEngine` |
| `availability` | AvailabilitySchedule, AvailabilitySlot, AvailabilitySnapshot | AvailabilityScheduleRepository | ✅ `CapacityEngine` (operates on `AIWorker.availability`) |
| `notifications` | WorkforceNotification | WorkforceNotificationRepository | contracts only |
| `governance` | ApprovalRequirement, ComplianceCheck, AuditRecord | ApprovalRequirementRepository, ComplianceCheckRepository, AuditRecordRepository | contracts only |
| `assignment` | AssignmentCriteria | — (uses `collaboration`'s `TaskAssignmentRepository`) | ✅ `AssignmentEngine` — deterministic selection, no AI/LLM |
| `queries` | WorkforceQueries (original contract), WorkforceRuntimeQueries | — | ✅ `WorkforceRuntimeQueries` |
| `events` | WorkforceEventMap, WorkforceDomainEvent | — | ✅ `WorkforceEventBus` |

`runtime.ts` is the composition root: `createWorkforceRuntime()` wires every real in-memory repository into the six real engines/services above and exposes only `registry`, `lifecycle`, `assignment`, `capacity`, `performance`, `capabilities`, `queries`, and `events` — repositories are never part of the returned surface.

---

## Dependency rules

| May depend on | Must not depend on |
| ------------- | ------------------ |
| `@lateen-os/shared-kernel` | Apps, services, UI |
| `@lateen-os/business-dna` | LLM SDKs |
| `@lateen-os/ai-runtime` | Database ORMs |
| `@lateen-os/decision-engine` | HTTP frameworks |
| `@lateen-os/institutional-memory` | Persistence implementations |
| `@lateen-os/intelligence-engine` | Other AI worker apps |

---

## Governance principle

AI workers **recommend** and **delegate** — they do **not** finalize business decisions. All decision finalization flows through `@lateen-os/decision-engine`.

See [WORKFORCE_MODEL.md](./WORKFORCE_MODEL.md) for organization diagram, worker lifecycle, and delegation flow.
