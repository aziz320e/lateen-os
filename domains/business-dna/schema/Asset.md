# Asset

## Purpose

An **Asset** represents a physical or digital resource owned or managed by the Organization. Assets track value, location, ownership, and lifecycle for operational and financial purposes.

## Responsibilities

- Register owned or leased resources with identification and valuation
- Link assets to branches, departments, employees, and projects
- Track depreciation, maintenance, and disposal
- Connect products and suppliers to physical inventory where applicable

## Attributes

| Attribute        | Type     | Required | Description                                                                   |
| ---------------- | -------- | -------- | ----------------------------------------------------------------------------- |
| `id`             | UUID     | Yes      | Stable unique identifier                                                      |
| `organizationId` | UUID     | Yes      | Owning organization                                                           |
| `code`           | String   | Yes      | Asset tag or code, unique within organization                                 |
| `name`           | String   | Yes      | Asset display name                                                            |
| `description`    | String   | No       | Asset description                                                             |
| `type`           | Enum     | Yes      | `physical`, `digital`, `vehicle`, `equipment`, `property`, `intellectual`     |
| `status`         | Enum     | Yes      | `draft`, `active`, `in_use`, `maintenance`, `retired`, `disposed`, `archived` |
| `category`       | String   | No       | Asset category                                                                |
| `serialNumber`   | String   | No       | Manufacturer serial number                                                    |
| `purchasePrice`  | Decimal  | No       | Acquisition cost                                                              |
| `currentValue`   | Decimal  | No       | Current book or market value                                                  |
| `currency`       | ISO 4217 | No       | Value currency                                                                |
| `branchId`       | UUID     | No       | Location branch                                                               |
| `departmentId`   | UUID     | No       | Owning department                                                             |
| `assignedToId`   | UUID     | No       | Employee currently assigned                                                   |
| `supplierId`     | UUID     | No       | Supplier who provided the asset                                               |
| `productId`      | UUID     | No       | Product the asset represents                                                  |
| `projectId`      | UUID     | No       | Project the asset supports                                                    |
| `acquiredAt`     | Date     | No       | Acquisition date                                                              |
| `retiredAt`      | Date     | No       | Retirement date                                                               |
| `createdAt`      | DateTime | Yes      | Record creation timestamp                                                     |
| `updatedAt`      | DateTime | Yes      | Last modification timestamp                                                   |

## Relationships

| Related Entity | Cardinality | Description                       |
| -------------- | ----------- | --------------------------------- |
| Organization   | many → 1    | Asset belongs to one organization |
| Branch         | many → 1    | Asset location                    |
| Department     | many → 1    | Owning department                 |
| Employee       | many → 1    | Assigned employee                 |
| Supplier       | many → 1    | Source supplier                   |
| Product        | many → 1    | Related product                   |
| Project        | many → 1    | Supporting project                |
| Workflow       | many → many | Maintenance or disposal workflows |
| KPI            | many → many | Asset utilization KPIs            |

## Lifecycle

```
draft → active → in_use → maintenance → in_use → retired → disposed → archived
```

| State         | Description                                      |
| ------------- | ------------------------------------------------ |
| `draft`       | Asset registered; not yet operational            |
| `active`      | Asset available for assignment                   |
| `in_use`      | Asset actively deployed or assigned              |
| `maintenance` | Asset under maintenance; temporarily unavailable |
| `retired`     | Asset no longer in use but retained              |
| `disposed`    | Asset sold, scrapped, or transferred out         |
| `archived`    | Record retained for audit only                   |

## Events

| Event                         | Trigger                         |
| ----------------------------- | ------------------------------- |
| `asset.created`               | New asset registered            |
| `asset.activated`             | Asset moved to active           |
| `asset.assigned`              | Asset assigned to employee      |
| `asset.unassigned`            | Asset unassigned                |
| `asset.maintenance_started`   | Asset entered maintenance       |
| `asset.maintenance_completed` | Asset returned from maintenance |
| `asset.retired`               | Asset retired                   |
| `asset.disposed`              | Asset disposed                  |
| `asset.archived`              | Asset archived                  |
| `asset.updated`               | Any attribute changed           |

## Business Rules

- Asset `code` must be unique within the organization.
- Disposed assets cannot be reassigned or returned to active use.
- Assets in maintenance cannot be assigned to employees.
- Purchase price and current value use the organization's default currency unless overridden.
- Intellectual assets may omit physical location fields.
