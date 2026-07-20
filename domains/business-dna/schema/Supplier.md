# Supplier

## Purpose

A **Supplier** represents a vendor or partner that provides goods or services to the Organization. Suppliers anchor procurement, cost tracking, and supply chain relationships.

## Responsibilities

- Define who the organization procures from
- Link to products, services, and assets sourced externally
- Support purchase workflows and cost accounting
- Provide context for operations and finance domains

## Attributes

| Attribute        | Type     | Required | Description                                                     |
| ---------------- | -------- | -------- | --------------------------------------------------------------- |
| `id`             | UUID     | Yes      | Stable unique identifier                                        |
| `organizationId` | UUID     | Yes      | Owning organization                                             |
| `code`           | String   | Yes      | Supplier code, unique within organization                       |
| `name`           | String   | Yes      | Supplier display name                                           |
| `type`           | Enum     | Yes      | `manufacturer`, `distributor`, `service_provider`, `contractor` |
| `status`         | Enum     | Yes      | `pending`, `approved`, `active`, `suspended`, `archived`        |
| `email`          | String   | No       | Primary contact email                                           |
| `phone`          | String   | No       | Primary contact phone                                           |
| `address`        | Address  | No       | Supplier address                                                |
| `taxId`          | String   | No       | Supplier tax identifier                                         |
| `currency`       | ISO 4217 | No       | Preferred payment currency                                      |
| `paymentTerms`   | String   | No       | Default payment terms                                           |
| `rating`         | Enum     | No       | `A`, `B`, `C`, `D` — supplier performance rating                |
| `createdAt`      | DateTime | Yes      | Record creation timestamp                                       |
| `updatedAt`      | DateTime | Yes      | Last modification timestamp                                     |

## Relationships

| Related Entity | Cardinality | Description                            |
| -------------- | ----------- | -------------------------------------- |
| Organization   | many → 1    | Supplier belongs to one organization   |
| Product        | many → many | Supplier may provide products          |
| Service        | many → many | Supplier may provide services          |
| Asset          | 1 → many    | Assets may be sourced from a supplier  |
| Invoice        | 1 → many    | Supplier invoices (payables)           |
| Policy         | many → many | Supplier compliance policies may apply |

## Lifecycle

```
pending → approved → active → suspended → archived
```

| State       | Description                                        |
| ----------- | -------------------------------------------------- |
| `pending`   | Supplier identified; approval not yet granted      |
| `approved`  | Supplier vetted and approved for procurement       |
| `active`    | Supplier available for orders and payments         |
| `suspended` | Procurement blocked; existing obligations retained |
| `archived`  | Relationship ended; read-only                      |

## Events

| Event                | Trigger                           |
| -------------------- | --------------------------------- |
| `supplier.created`   | New supplier record created       |
| `supplier.approved`  | Supplier approved for procurement |
| `supplier.activated` | Supplier moved to active          |
| `supplier.suspended` | Supplier suspended                |
| `supplier.archived`  | Supplier archived                 |
| `supplier.updated`   | Any attribute changed             |

## Business Rules

- Supplier `code` must be unique within the organization.
- Pending suppliers cannot be linked to active purchase orders.
- Suspended suppliers block new procurement but retain payable obligations.
- Supplier approval may require workflow completion per organization policy.
- Supplier rating is updated by operations or finance domains; not self-declared.
