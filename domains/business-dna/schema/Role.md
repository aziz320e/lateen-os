# Role

## Purpose

A **Role** is a named set of responsibilities within the Organization. Roles group permissions and define what an employee or AI agent is authorized to do.

## Responsibilities

- Bundle permissions into assignable units
- Define job-function access patterns (e.g. sales manager, finance approver)
- Link employees and AI agents to authorization policies
- Support role hierarchy and inheritance where defined

## Attributes

| Attribute        | Type     | Required | Description                                 |
| ---------------- | -------- | -------- | ------------------------------------------- |
| `id`             | UUID     | Yes      | Stable unique identifier                    |
| `organizationId` | UUID     | Yes      | Parent organization                         |
| `code`           | String   | Yes      | Short role code, unique within organization |
| `name`           | String   | Yes      | Role display name                           |
| `description`    | String   | No       | Scope and responsibilities of the role      |
| `type`           | Enum     | Yes      | `human`, `agent`, `system`, `hybrid`        |
| `status`         | Enum     | Yes      | `active`, `inactive`, `archived`            |
| `parentRoleId`   | UUID     | No       | Parent role for inheritance                 |
| `departmentId`   | UUID     | No       | Department this role primarily serves       |
| `createdAt`      | DateTime | Yes      | Record creation timestamp                   |
| `updatedAt`      | DateTime | Yes      | Last modification timestamp                 |

## Relationships

| Related Entity | Cardinality | Description                              |
| -------------- | ----------- | ---------------------------------------- |
| Organization   | many → 1    | Role belongs to one organization         |
| Department     | many → 1    | Role may be scoped to a department       |
| Role           | many → 1    | Child roles may inherit from parent      |
| Permission     | many → many | Role grants permissions                  |
| Employee       | many → many | Employees are assigned roles             |
| AI Agent       | many → many | Agents are assigned roles                |
| Workflow       | many → many | Roles may be required at workflow stages |

## Lifecycle

```
draft → active → inactive → archived
```

| State      | Description                                       |
| ---------- | ------------------------------------------------- |
| `draft`    | Role defined; permissions not yet assigned        |
| `active`   | Role may be assigned to employees and agents      |
| `inactive` | No new assignments; existing assignments retained |
| `archived` | Permanently retired; read-only                    |

## Events

| Event                     | Trigger                      |
| ------------------------- | ---------------------------- |
| `role.created`            | New role created             |
| `role.activated`          | Role moved to active         |
| `role.deactivated`        | Role moved to inactive       |
| `role.archived`           | Role archived                |
| `role.permission_granted` | Permission added to role     |
| `role.permission_revoked` | Permission removed from role |
| `role.updated`            | Any attribute changed        |

## Business Rules

- Role `code` must be unique within the organization.
- A role cannot inherit from itself or create circular inheritance chains.
- System roles cannot be assigned to human employees.
- Agent-type roles may only be assigned to AI agents registered in Business DNA.
- Revoking a permission from a role takes effect immediately for all holders.
