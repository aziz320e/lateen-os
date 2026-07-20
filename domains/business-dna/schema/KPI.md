# KPI

## Purpose

A **KPI** (Key Performance Indicator) defines a measurable metric tracked by the Organization. KPIs connect business goals to operational data and AI agent monitoring in Proactive Mode.

## Responsibilities

- Define what is measured, how, and at what frequency
- Set targets and thresholds for alerts and reporting
- Scope metrics to organization, branch, department, or entity
- Feed Intelligence forecasting and AI Workforce proactive monitoring

## Attributes

| Attribute           | Type     | Required | Description                                                      |
| ------------------- | -------- | -------- | ---------------------------------------------------------------- |
| `id`                | UUID     | Yes      | Stable unique identifier                                         |
| `organizationId`    | UUID     | Yes      | Owning organization                                              |
| `code`              | String   | Yes      | KPI code, unique within organization                             |
| `name`              | String   | Yes      | KPI display name                                                 |
| `description`       | String   | No       | What this KPI measures and why                                   |
| `type`              | Enum     | Yes      | `financial`, `operational`, `sales`, `customer`, `hr`, `quality` |
| `status`            | Enum     | Yes      | `draft`, `active`, `inactive`, `archived`                        |
| `unit`              | String   | Yes      | Unit of measure (e.g. `%`, `currency`, `count`, `days`)          |
| `direction`         | Enum     | Yes      | `higher_is_better`, `lower_is_better`, `target_is_best`          |
| `target`            | Decimal  | No       | Target value                                                     |
| `warningThreshold`  | Decimal  | No       | Value triggering warning alert                                   |
| `criticalThreshold` | Decimal  | No       | Value triggering critical alert                                  |
| `frequency`         | Enum     | Yes      | `real_time`, `daily`, `weekly`, `monthly`, `quarterly`, `annual` |
| `departmentId`      | UUID     | No       | Department scope                                                 |
| `branchId`          | UUID     | No       | Branch scope                                                     |
| `entityType`        | String   | No       | Related entity type (e.g. `product`, `project`)                  |
| `entityId`          | UUID     | No       | Related entity instance                                          |
| `createdAt`         | DateTime | Yes      | Record creation timestamp                                        |
| `updatedAt`         | DateTime | Yes      | Last modification timestamp                                      |

## Relationships

| Related Entity | Cardinality | Description                            |
| -------------- | ----------- | -------------------------------------- |
| Organization   | many → 1    | KPI belongs to one organization        |
| Department     | many → 1    | Department-scoped KPI                  |
| Branch         | many → 1    | Branch-scoped KPI                      |
| Product        | many → 1    | Product-specific KPI                   |
| Project        | many → 1    | Project-specific KPI                   |
| Policy         | many → many | Policies linked to KPI compliance      |
| AI Agent       | many → many | Agents monitoring this KPI proactively |

## Lifecycle

```
draft → active → inactive → archived
```

| State      | Description                             |
| ---------- | --------------------------------------- |
| `draft`    | KPI defined; measurement not yet active |
| `active`   | KPI tracked and reported                |
| `inactive` | Measurement paused                      |
| `archived` | Retired; historical data retained       |

## Events

| Event                    | Trigger                                |
| ------------------------ | -------------------------------------- |
| `kpi.created`            | New KPI defined                        |
| `kpi.activated`          | KPI moved to active                    |
| `kpi.deactivated`        | KPI moved to inactive                  |
| `kpi.archived`           | KPI archived                           |
| `kpi.target_changed`     | Target or thresholds updated           |
| `kpi.measured`           | New measurement recorded               |
| `kpi.threshold_breached` | Warning or critical threshold breached |
| `kpi.updated`            | Any attribute changed                  |

## Business Rules

- KPI `code` must be unique within the organization.
- Active KPIs must define a `unit` and `frequency`.
- Threshold alerts require both `direction` and at least one threshold when configured.
- KPI measurements are append-only; historical values are never overwritten.
- AI agents in Proactive Mode monitor active KPIs scoped to their role and department.
