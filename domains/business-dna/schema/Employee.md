# Employee

## Purpose

An **Employee** represents a person employed by or contracted with the Organization. Employees are the human actors who operate business domains, approve workflows, and interact with AI agents.

## Responsibilities

- Link a person to the organization with employment details
- Assign roles and permissions for authorization
- Anchor ownership and accountability on projects, orders, and workflows
- Provide the human counterpart to AI agent assignments

## Attributes

| Attribute        | Type     | Required | Description                                                 |
| ---------------- | -------- | -------- | ----------------------------------------------------------- |
| `id`             | UUID     | Yes      | Stable unique identifier                                    |
| `organizationId` | UUID     | Yes      | Parent organization                                         |
| `branchId`       | UUID     | No       | Primary branch assignment                                   |
| `departmentId`   | UUID     | No       | Primary department assignment                               |
| `employeeNumber` | String   | Yes      | Unique employee number within organization                  |
| `firstName`      | String   | Yes      | Given name                                                  |
| `lastName`       | String   | Yes      | Family name                                                 |
| `email`          | String   | Yes      | Work email address                                          |
| `phone`          | String   | No       | Work phone number                                           |
| `jobTitle`       | String   | No       | Current job title                                           |
| `employmentType` | Enum     | Yes      | `full_time`, `part_time`, `contractor`, `intern`            |
| `status`         | Enum     | Yes      | `active`, `on_leave`, `suspended`, `terminated`, `archived` |
| `managerId`      | UUID     | No       | Direct reporting manager (Employee)                         |
| `hiredAt`        | Date     | No       | Start date                                                  |
| `terminatedAt`   | Date     | No       | End date if terminated                                      |
| `identityId`     | UUID     | No       | Link to Core identity record                                |
| `createdAt`      | DateTime | Yes      | Record creation timestamp                                   |
| `updatedAt`      | DateTime | Yes      | Last modification timestamp                                 |

## Relationships

| Related Entity | Cardinality | Description                                       |
| -------------- | ----------- | ------------------------------------------------- |
| Organization   | many → 1    | Employee belongs to one organization              |
| Branch         | many → 1    | Employee may be assigned to a branch              |
| Department     | many → 1    | Employee belongs to a department                  |
| Employee       | many → 1    | Manager is another employee                       |
| Role           | many → many | Employee holds one or more roles                  |
| Project        | many → many | Employee may own or participate in projects       |
| Quotation      | 1 → many    | Employee may create quotations                    |
| Order          | 1 → many    | Employee may own orders                           |
| AI Agent       | many → many | Employee may supervise or collaborate with agents |

## Lifecycle

```
draft → active → on_leave → active → suspended → terminated → archived
```

| State        | Description                                            |
| ------------ | ------------------------------------------------------ |
| `draft`      | Record created; onboarding not complete                |
| `active`     | Fully operational employee                             |
| `on_leave`   | Temporarily unavailable; permissions may be restricted |
| `suspended`  | Access revoked; record retained                        |
| `terminated` | Employment ended                                       |
| `archived`   | Record retained for audit only                         |

## Events

| Event                    | Trigger                      |
| ------------------------ | ---------------------------- |
| `employee.created`       | New employee record created  |
| `employee.activated`     | Employee onboarding complete |
| `employee.on_leave`      | Employee placed on leave     |
| `employee.returned`      | Employee returned from leave |
| `employee.suspended`     | Employee suspended           |
| `employee.terminated`    | Employment terminated        |
| `employee.archived`      | Record archived              |
| `employee.role_assigned` | Role assigned to employee    |
| `employee.role_revoked`  | Role removed from employee   |
| `employee.updated`       | Any attribute changed        |

## Business Rules

- Employee `employeeNumber` and `email` must be unique within the organization.
- Terminated employees cannot hold active roles or approve workflows.
- An employee cannot be their own manager.
- Role assignments must reference active roles within the same organization.
- AI agents may act on behalf of an employee only when explicitly delegated in Business DNA.
