# Department

## Purpose

A **Department** represents an organizational unit within the business hierarchy. Departments group employees, define reporting structure, and scope workflows and KPIs.

## Responsibilities

- Define the organizational hierarchy and reporting lines
- Group employees by function (e.g. sales, finance, operations)
- Scope workflows, projects, and KPIs to functional areas
- Link to AI agents assigned to departmental roles

## Attributes

| Attribute            | Type     | Required | Description                            |
| -------------------- | -------- | -------- | -------------------------------------- |
| `id`                 | UUID     | Yes      | Stable unique identifier               |
| `organizationId`     | UUID     | Yes      | Parent organization                    |
| `branchId`           | UUID     | No       | Branch the department belongs to       |
| `parentDepartmentId` | UUID     | No       | Parent department for hierarchy        |
| `code`               | String   | Yes      | Short code, unique within organization |
| `name`               | String   | Yes      | Department display name                |
| `description`        | String   | No       | Purpose and scope of the department    |
| `status`             | Enum     | Yes      | `active`, `inactive`, `archived`       |
| `headId`             | UUID     | No       | Employee who leads the department      |
| `costCenter`         | String   | No       | Financial cost center code             |
| `createdAt`          | DateTime | Yes      | Record creation timestamp              |
| `updatedAt`          | DateTime | Yes      | Last modification timestamp            |

## Relationships

| Related Entity | Cardinality | Description                            |
| -------------- | ----------- | -------------------------------------- |
| Organization   | many → 1    | Department belongs to one organization |
| Branch         | many → 1    | Department may belong to a branch      |
| Department     | many → 1    | Sub-departments reference a parent     |
| Employee       | 1 → many    | Employees are assigned to departments  |
| KPI            | 1 → many    | KPIs may be scoped to a department     |
| Workflow       | 1 → many    | Workflows may be owned by a department |
| AI Agent       | 1 → many    | Agents may be assigned to a department |

## Lifecycle

```
draft → active → inactive → archived
```

| State      | Description                                     |
| ---------- | ----------------------------------------------- |
| `draft`    | Department defined but not yet staffed          |
| `active`   | Department accepts employee assignments         |
| `inactive` | No new assignments; existing employees retained |
| `archived` | Permanently dissolved; read-only                |

## Events

| Event                     | Trigger                      |
| ------------------------- | ---------------------------- |
| `department.created`      | New department created       |
| `department.activated`    | Department moved to active   |
| `department.deactivated`  | Department moved to inactive |
| `department.archived`     | Department archived          |
| `department.restructured` | Parent or hierarchy changed  |
| `department.updated`      | Any attribute changed        |

## Business Rules

- Department `code` must be unique within the organization.
- A department cannot be its own ancestor in the hierarchy.
- Archiving a department requires reassigning all active employees.
- Department head must be an active employee within the same organization.
- Circular reporting hierarchies are prohibited.
