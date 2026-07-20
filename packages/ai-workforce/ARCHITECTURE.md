# AI Workforce — Package Architecture

> **Lateen OS Architecture v1.0 (Locked)** — Layer 4: AI Workforce

## Purpose

`@lateen-os/ai-workforce` is the **canonical organizational layer for digital employees** in Lateen OS. It sits above `@lateen-os/ai-runtime` and defines how AI workers are registered, organized, delegated, supervised, measured, and governed.

The package defines models and ports only — no LLM integration, persistence, UI, or API.

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

| Module | Types | Repository |
| ------ | ----- | ---------- |
| `worker` | AIWorker, WorkerProfile, WorkerRole, WorkerStatus, WorkerCapability, WorkerSkill, WorkerAvailability | WorkerRepository |
| `registry` | WorkerRegistry, WorkerRegistration, WorkerDescriptor | WorkerRegistrationRepository, WorkerRegistryRepository |
| `organization` | WorkforceOrgUnit, ReportingLine | WorkforceOrgUnitRepository |
| `skills` | SkillDefinition, SkillProficiency | SkillDefinitionRepository |
| `teams` | AITeam, TeamMember, TeamLead | TeamRepository, TeamMemberRepository |
| `delegation` | DelegationRequest, DelegationRule, DelegationResult | DelegationRequestRepository, DelegationRuleRepository |
| `collaboration` | Conversation, TaskAssignment, SharedContext | ConversationRepository, TaskAssignmentRepository, SharedContextRepository |
| `supervision` | Supervisor, Review, Escalation | SupervisorRepository, ReviewRepository, EscalationRepository |
| `goals` | Goal, Objective, KeyResult | GoalRepository, ObjectiveRepository, KeyResultRepository |
| `performance` | PerformanceMetrics, WorkerScore, TaskStatistics | PerformanceMetricsRepository |
| `availability` | AvailabilitySchedule, AvailabilitySlot, AvailabilitySnapshot | AvailabilityScheduleRepository |
| `notifications` | WorkforceNotification | WorkforceNotificationRepository |
| `governance` | ApprovalRequirement, ComplianceCheck, AuditRecord | ApprovalRequirementRepository, ComplianceCheckRepository, AuditRecordRepository |
| `queries` | WorkforceQueries | — |

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
