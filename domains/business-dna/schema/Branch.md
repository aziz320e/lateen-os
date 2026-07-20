# Branch

## Purpose

A **Branch** represents a physical location, subsidiary, or regional unit within an Organization. Branches scope operations, employees, assets, and transactions to a geographic or legal subdivision.

## Responsibilities

- Define regional or locational context for departments and employees
- Hold branch-specific contact details and operating parameters
- Scope assets, orders, and projects to a location when required
- Support multi-branch reporting and KPI aggregation

## Attributes

| Attribute        | Type     | Required | Description                                                   |
| ---------------- | -------- | -------- | ------------------------------------------------------------- |
| `id`             | UUID     | Yes      | Stable unique identifier                                      |
| `organizationId` | UUID     | Yes      | Parent organization                                           |
| `code`           | String   | Yes      | Short branch code, unique within organization                 |
| `name`           | String   | Yes      | Branch display name                                           |
| `type`           | Enum     | Yes      | `headquarters`, `branch`, `subsidiary`, `warehouse`, `remote` |
| `status`         | Enum     | Yes      | `active`, `inactive`, `archived`                              |
| `address`        | Address  | No       | Physical address                                              |
| `phone`          | String   | No       | Contact phone                                                 |
| `email`          | String   | No       | Contact email                                                 |
| `currency`       | ISO 4217 | No       | Override currency; defaults to organization                   |
| `timezone`       | IANA     | No       | Override timezone; defaults to organization                   |
| `managerId`      | UUID     | No       | Employee responsible for the branch                           |
| `openedAt`       | Date     | No       | Date branch became operational                                |
| `createdAt`      | DateTime | Yes      | Record creation timestamp                                     |
| `updatedAt`      | DateTime | Yes      | Last modification timestamp                                   |

## Relationships

| Related Entity | Cardinality | Description                           |
| -------------- | ----------- | ------------------------------------- |
| Organization   | many → 1    | Branch belongs to one organization    |
| Department     | 1 → many    | Branch may contain departments        |
| Employee       | 1 → many    | Employees may be assigned to a branch |
| Asset          | 1 → many    | Assets may be located at a branch     |
| Project        | 1 → many    | Projects may be scoped to a branch    |
| Order          | 1 → many    | Orders may originate from a branch    |

## Lifecycle

```
draft → active → inactive → archived
```

| State      | Description                                   |
| ---------- | --------------------------------------------- |
| `draft`    | Branch defined but not yet operational        |
| `active`   | Branch accepts operations and assignments     |
| `inactive` | No new assignments; existing records retained |
| `archived` | Permanently closed; read-only                 |

## Events

| Event                | Trigger                   |
| -------------------- | ------------------------- |
| `branch.created`     | New branch record created |
| `branch.activated`   | Branch moved to active    |
| `branch.deactivated` | Branch moved to inactive  |
| `branch.archived`    | Branch archived           |
| `branch.updated`     | Any attribute changed     |

## Business Rules

- Branch `code` must be unique within the parent organization.
- At least one branch of type `headquarters` must exist for an active organization.
- An employee's primary branch determines default scoping for orders and projects.
- Archiving a branch requires reassigning active employees and assets to another branch or marking them inactive.
