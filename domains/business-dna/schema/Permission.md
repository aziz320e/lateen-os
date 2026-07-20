# Permission

## Purpose

A **Permission** is a granular access rule that defines what actions an actor may perform on a resource within the Organization. Permissions are the atomic unit of authorization evaluated by Core.

## Responsibilities

- Define allowed actions on Business DNA entities and domain resources
- Bind access rules to roles, employees, and AI agents
- Enforce least-privilege access across the organization
- Support scoped permissions (organization, branch, department, entity)

## Attributes

| Attribute        | Type     | Required | Description                                                |
| ---------------- | -------- | -------- | ---------------------------------------------------------- |
| `id`             | UUID     | Yes      | Stable unique identifier                                   |
| `organizationId` | UUID     | Yes      | Parent organization                                        |
| `code`           | String   | Yes      | Permission code (e.g. `order.approve`)                     |
| `name`           | String   | Yes      | Human-readable permission name                             |
| `description`    | String   | No       | What this permission allows                                |
| `resource`       | String   | Yes      | Target resource type (e.g. `order`, `invoice`)             |
| `action`         | Enum     | Yes      | `create`, `read`, `update`, `delete`, `approve`, `execute` |
| `scope`          | Enum     | Yes      | `organization`, `branch`, `department`, `own`, `entity`    |
| `status`         | Enum     | Yes      | `active`, `inactive`, `archived`                           |
| `policyId`       | UUID     | No       | Policy that governs this permission                        |
| `createdAt`      | DateTime | Yes      | Record creation timestamp                                  |
| `updatedAt`      | DateTime | Yes      | Last modification timestamp                                |

## Relationships

| Related Entity | Cardinality | Description                               |
| -------------- | ----------- | ----------------------------------------- |
| Organization   | many → 1    | Permission belongs to one organization    |
| Role           | many → many | Permissions are granted through roles     |
| Policy         | many → 1    | Permission may be governed by a policy    |
| Employee       | many → many | Direct permission grants (exception path) |
| AI Agent       | many → many | Direct permission grants for agents       |

## Lifecycle

```
draft → active → inactive → archived
```

| State      | Description                                  |
| ---------- | -------------------------------------------- |
| `draft`    | Permission defined but not yet grantable     |
| `active`   | Permission may be assigned to roles          |
| `inactive` | Permission cannot be newly assigned          |
| `archived` | Retired; existing grants evaluated as denied |

## Events

| Event                    | Trigger                      |
| ------------------------ | ---------------------------- |
| `permission.created`     | New permission defined       |
| `permission.activated`   | Permission moved to active   |
| `permission.deactivated` | Permission moved to inactive |
| `permission.archived`    | Permission archived          |
| `permission.updated`     | Any attribute changed        |

## Business Rules

- Permission `code` must be unique within the organization.
- Permission codes follow the pattern `{resource}.{action}`.
- Direct employee permission grants require policy approval when a governing policy exists.
- AI agent permissions must be agent-type roles; agents cannot hold permissions beyond their registered scope.
- Archived permissions cause Core authorization to deny regardless of role assignment.
