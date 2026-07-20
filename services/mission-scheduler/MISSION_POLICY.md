# Mission Policy

## Policy model

Scheduler policies are stored as JSON rule contracts per organization. They gate **when** scheduling is allowed — not **what** business logic runs.

## Policy integration points

| Engine | Policy use |
| ------ | ---------- |
| Decision Engine | Approve autonomous scheduling for sensitive mission types |
| Business DNA | Organizational policies reference |
| Workflow Engine | Workflow-completed triggers respect policy refs on schedule rules |

## Schedule rule policy ref

Each `ScheduleRule` may include `policyRef` pointing to a Decision Engine or BDS policy identifier. v1 stores the reference; enforcement integrates in future sprints.

## Default policies (v1 contracts)

| Policy | Rule |
| ------ | ---- |
| Working hours | Missions with `workingHoursOnly` defer to next calendar slot |
| Retry limit | Max 3 attempts before dead letter |
| SLA | 60-minute default deadline |
| Priority | CRITICAL missions preempt LOW in BullMQ |

## Sensitive mission types

Compliance Audit and Financial Review should require Decision Engine approval before autonomous scheduling in production. v1 accepts manual trigger only via API contract.

## API

Policies are listed via repository port. Full CRUD integrates with Decision Engine HTTP service in a future sprint.

```http
GET /api/scheduler/schedules
# Each schedule may include policyRef
```

## No business logic

The scheduler evaluates policy **references** and **scheduling constraints** only. Business rules remain in Decision Engine and Business DNA.
