# Policy

## Purpose

A **Policy** is a business rule, constraint, or compliance requirement defined within the Organization. Policies govern how entities behave and what actions require approval or restriction.

## Responsibilities

- Define enforceable business rules across domains
- Link to permissions, workflows, and entity types they govern
- Support compliance, financial controls, and operational constraints
- Provide the rule set that Core authorization and AI agents evaluate

## Attributes

| Attribute           | Type     | Required | Description                                                         |
| ------------------- | -------- | -------- | ------------------------------------------------------------------- |
| `id`                | UUID     | Yes      | Stable unique identifier                                            |
| `organizationId`    | UUID     | Yes      | Owning organization                                                 |
| `code`              | String   | Yes      | Policy code, unique within organization                             |
| `name`              | String   | Yes      | Policy display name                                                 |
| `description`       | String   | No       | Full policy text or summary                                         |
| `type`              | Enum     | Yes      | `compliance`, `financial`, `operational`, `security`, `hr`, `sales` |
| `status`            | Enum     | Yes      | `draft`, `active`, `suspended`, `archived`                          |
| `severity`          | Enum     | No       | `info`, `warning`, `critical`                                       |
| `entityType`        | String   | No       | Entity type this policy applies to                                  |
| `effectiveFrom`     | Date     | No       | Date policy takes effect                                            |
| `effectiveUntil`    | Date     | No       | Date policy expires                                                 |
| `ownerDepartmentId` | UUID     | No       | Department responsible for the policy                               |
| `approvedById`      | UUID     | No       | Employee who approved the policy                                    |
| `approvedAt`        | DateTime | No       | Approval timestamp                                                  |
| `createdAt`         | DateTime | Yes      | Record creation timestamp                                           |
| `updatedAt`         | DateTime | Yes      | Last modification timestamp                                         |

## Relationships

| Related Entity | Cardinality | Description                        |
| -------------- | ----------- | ---------------------------------- |
| Organization   | many → 1    | Policy belongs to one organization |
| Department     | many → 1    | Owning department                  |
| Employee       | many → 1    | Approving employee                 |
| Permission     | 1 → many    | Permissions governed by policy     |
| Workflow       | many → many | Workflows enforcing policy         |
| Customer       | many → many | Customer-specific policies         |
| Supplier       | many → many | Supplier compliance policies       |
| KPI            | many → many | KPIs measuring policy compliance   |

## Lifecycle

```
draft → active → suspended → active → archived
```

| State       | Description                         |
| ----------- | ----------------------------------- |
| `draft`     | Policy drafted; not yet enforceable |
| `active`    | Policy in effect and enforced       |
| `suspended` | Temporarily not enforced            |
| `archived`  | Permanently retired; read-only      |

## Events

| Event                | Trigger                            |
| -------------------- | ---------------------------------- |
| `policy.created`     | New policy created                 |
| `policy.approved`    | Policy approved for activation     |
| `policy.activated`   | Policy moved to active             |
| `policy.suspended`   | Policy suspended                   |
| `policy.reactivated` | Policy reactivated from suspension |
| `policy.expired`     | Policy passed effectiveUntil date  |
| `policy.archived`    | Policy archived                    |
| `policy.updated`     | Any attribute changed              |

## Business Rules

- Policy `code` must be unique within the organization.
- Active policies must have an `effectiveFrom` date on or before the current date.
- Critical policies require workflow approval before activation.
- Suspended policies cause permissive fallback only when explicitly configured; default is deny for security policies.
- AI agents must evaluate applicable policies before proactive recommendations and reactive actions.
