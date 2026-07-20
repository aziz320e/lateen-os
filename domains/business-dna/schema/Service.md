# Service

## Purpose

A **Service** represents a deliverable service that the Organization provides. Services differ from products in that they are performed, time-bound, or outcome-based rather than physically delivered goods.

## Responsibilities

- Define service offerings in the catalog
- Hold pricing models (fixed, hourly, recurring)
- Link to projects, employees, and delivery workflows
- Anchor service line items in commercial documents

## Attributes

| Attribute           | Type     | Required | Description                                                         |
| ------------------- | -------- | -------- | ------------------------------------------------------------------- |
| `id`                | UUID     | Yes      | Stable unique identifier                                            |
| `organizationId`    | UUID     | Yes      | Owning organization                                                 |
| `code`              | String   | Yes      | Service code, unique within organization                            |
| `name`              | String   | Yes      | Service display name                                                |
| `description`       | String   | No       | Service description and scope                                       |
| `type`              | Enum     | Yes      | `consulting`, `maintenance`, `support`, `implementation`, `managed` |
| `status`            | Enum     | Yes      | `draft`, `active`, `discontinued`, `archived`                       |
| `pricingModel`      | Enum     | Yes      | `fixed`, `hourly`, `daily`, `monthly`, `outcome_based`              |
| `basePrice`         | Decimal  | No       | Default price per pricing model unit                                |
| `currency`          | ISO 4217 | No       | Price currency                                                      |
| `estimatedDuration` | Duration | No       | Typical delivery duration                                           |
| `departmentId`      | UUID     | No       | Department responsible for delivery                                 |
| `supplierId`        | UUID     | No       | External supplier if outsourced                                     |
| `createdAt`         | DateTime | Yes      | Record creation timestamp                                           |
| `updatedAt`         | DateTime | Yes      | Last modification timestamp                                         |

## Relationships

| Related Entity | Cardinality | Description                             |
| -------------- | ----------- | --------------------------------------- |
| Organization   | many → 1    | Service belongs to one organization     |
| Department     | many → 1    | Delivering department                   |
| Supplier       | many → 1    | External provider if outsourced         |
| Project        | 1 → many    | Services may be delivered via projects  |
| Quotation      | many → many | Service appears on quotation line items |
| Order          | many → many | Service appears on order line items     |
| Invoice        | many → many | Service appears on invoice line items   |
| Workflow       | many → many | Delivery workflows for the service      |

## Lifecycle

```
draft → active → discontinued → archived
```

| State          | Description                                    |
| -------------- | ---------------------------------------------- |
| `draft`        | Service defined; not yet offerable             |
| `active`       | Service available for quotations and orders    |
| `discontinued` | No new engagements; existing contracts honored |
| `archived`     | Retired; read-only                             |

## Events

| Event                   | Trigger                 |
| ----------------------- | ----------------------- |
| `service.created`       | New service created     |
| `service.activated`     | Service moved to active |
| `service.discontinued`  | Service discontinued    |
| `service.archived`      | Service archived        |
| `service.price_changed` | Base price updated      |
| `service.updated`       | Any attribute changed   |

## Business Rules

- Service `code` must be unique within the organization.
- Hourly and daily services require a delivering department when active.
- Outcome-based services must link to a KPI or measurable outcome definition.
- Discontinued services cannot be added to new quotations.
- Outsourced services must reference an approved supplier.
