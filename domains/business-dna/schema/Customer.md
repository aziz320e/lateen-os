# Customer

> **Enrichment:** Business DNA Enrichment v1 — Lateen-specific

## Purpose

A **Customer** at Lateen is a **B2B commercial account** — a company, government entity, contractor, or enterprise group that procures printing, signage, branding, and manufacturing services at scale.

Lateen customers range from single-site retailers to nationwide chains requiring recurring production runs, framework agreements, and multi-branch rollouts. The Customer entity anchors enterprise contracts, recurring order schedules, and account-level AI monitoring.

## Responsibilities

- Define B2B client identity, hierarchy, and commercial relationship tier
- Hold enterprise contract terms, SLA commitments, and pricing agreements
- Manage recurring order schedules and standing production requirements
- Assign account teams and AI agent coverage (Sales AI, Operations AI)
- Track account health, credit exposure, and contract utilization
- Scope projects — signage rollouts, branding programs, construction site packages

## Attributes

### Core Identity

| Attribute         | Type     | Required | Description                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `id`              | UUID     | Yes      | Stable unique identifier                                                                                    |
| `organizationId`  | UUID     | Yes      | Owning organization (Lateen)                                                                                |
| `code`            | String   | Yes      | Customer code (e.g. `C-ALRAJHI-001`)                                                                        |
| `name`            | String   | Yes      | Company or account name                                                                                     |
| `legalName`       | String   | No       | Registered legal entity name                                                                                |
| `type`            | Enum     | Yes      | `corporate`, `government`, `contractor`, `agency`, `retail_chain`, `developer`, `hospitality`, `healthcare` |
| `status`          | Enum     | Yes      | `prospect`, `qualified`, `active`, `on_hold`, `churned`, `archived`                                         |
| `segment`         | Enum     | Yes      | `sme`, `mid_market`, `enterprise`, `strategic`                                                              |
| `taxId`           | String   | No       | Customer VAT registration (ZATCA)                                                                           |
| `crNumber`        | String   | No       | Customer Commercial Registration number                                                                     |
| `email`           | String   | No       | Primary commercial contact email                                                                            |
| `phone`           | String   | No       | Primary contact phone                                                                                       |
| `billingAddress`  | Address  | No       | Billing address                                                                                             |
| `shippingAddress` | Address  | No       | Default delivery address                                                                                    |
| `currency`        | ISO 4217 | Yes      | Preferred currency (`SAR`)                                                                                  |

### Account Management

| Attribute             | Type    | Required | Description                                                                                                          |
| --------------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `accountManagerId`    | UUID    | No       | Primary Lateen account manager (Employee)                                                                            |
| `salesAiAgentId`      | UUID    | No       | Assigned Sales AI agent                                                                                              |
| `operationsAiAgentId` | UUID    | No       | Assigned Operations AI for fulfillment monitoring                                                                    |
| `accountTier`         | Enum    | No       | `standard`, `priority`, `enterprise`, `strategic_partner`                                                            |
| `industryVertical`    | Enum    | No       | `retail`, `construction`, `banking`, `healthcare`, `hospitality`, `government`, `real_estate`, `education`, `events` |
| `siteCount`           | Integer | No       | Number of customer sites/branches                                                                                    |
| `regionCoverage`      | Enum[]  | No       | `central`, `western`, `eastern`, `northern`, `southern`, `nationwide`                                                |

### Enterprise Contract

| Attribute                | Type    | Required | Description                                                                         |
| ------------------------ | ------- | -------- | ----------------------------------------------------------------------------------- |
| `contractType`           | Enum    | No       | `spot`, `framework`, `annual`, `multi_year`, `master_service_agreement`             |
| `contractStatus`         | Enum    | No       | `none`, `draft`, `active`, `expiring`, `expired`, `terminated`                      |
| `contractReference`      | String  | No       | Contract document reference number                                                  |
| `contractStartDate`      | Date    | No       | Contract effective start                                                            |
| `contractEndDate`        | Date    | No       | Contract expiry date                                                                |
| `contractValue`          | Decimal | No       | Total contract value (SAR)                                                          |
| `contractUtilizationPct` | Decimal | No       | Percentage of contract value consumed (derived)                                     |
| `slaTier`                | Enum    | No       | `standard`, `priority`, `enterprise` — inherited from Organization default if unset |
| `slaResponseHours`       | Integer | No       | Guaranteed response time for production requests                                    |
| `slaDeliveryDays`        | Integer | No       | Guaranteed delivery lead time                                                       |
| `paymentTerms`           | String  | No       | Contract payment terms (e.g. `net_30`, `net_60`, `milestone`)                       |
| `creditLimit`            | Decimal | No       | Maximum outstanding credit (SAR)                                                    |
| `creditUsed`             | Decimal | No       | Current outstanding balance (derived)                                               |
| `discountTierPct`        | Decimal | No       | Contractual discount off list price                                                 |
| `priceListId`            | UUID    | No       | Custom price list reference                                                         |

### Recurring Orders

| Attribute               | Type     | Required | Description                                   |
| ----------------------- | -------- | -------- | --------------------------------------------- |
| `recurringOrderEnabled` | Boolean  | No       | Whether customer has standing orders          |
| `recurringSchedules`    | Object[] | No       | Array of recurring order schedule definitions |
| `nextRecurringOrderAt`  | DateTime | No       | Next scheduled recurring order generation     |
| `standingProducts`      | UUID[]   | No       | Products on standing/recurring schedule       |

#### Recurring Schedule Object

| Field               | Type    | Description                                                       |
| ------------------- | ------- | ----------------------------------------------------------------- |
| `scheduleId`        | UUID    | Schedule identifier                                               |
| `productId`         | UUID    | Product ordered on schedule                                       |
| `frequency`         | Enum    | `weekly`, `biweekly`, `monthly`, `quarterly`, `on_demand_trigger` |
| `quantity`          | Decimal | Standing quantity per cycle                                       |
| `deliveryBranchId`  | UUID    | Delivery destination branch/site                                  |
| `autoGenerateOrder` | Boolean | Whether Operations AI auto-generates the order                    |
| `status`            | Enum    | `active`, `paused`, `cancelled`                                   |

### Account Health

| Attribute       | Type     | Required | Description                                           |
| --------------- | -------- | -------- | ----------------------------------------------------- |
| `healthScore`   | Decimal  | No       | Account health score (0–100, derived by Intelligence) |
| `healthStatus`  | Enum     | No       | `healthy`, `at_risk`, `critical`                      |
| `lastOrderAt`   | DateTime | No       | Date of last order                                    |
| `churnRisk`     | Enum     | No       | `low`, `medium`, `high` — from Customer Insights      |
| `lifetimeValue` | Decimal  | No       | Total revenue from customer (derived)                 |

### Audit

| Attribute   | Type     | Required | Description                 |
| ----------- | -------- | -------- | --------------------------- |
| `createdAt` | DateTime | Yes      | Record creation timestamp   |
| `updatedAt` | DateTime | Yes      | Last modification timestamp |

## Relationships

| Related Entity | Cardinality | Description                                  |
| -------------- | ----------- | -------------------------------------------- |
| Organization   | many → 1    | Customer belongs to Lateen                   |
| Employee       | many → 1    | Account manager                              |
| AI Agent       | many → many | Sales AI, Operations AI assigned             |
| Quotation      | 1 → many    | Quotations issued to customer                |
| Order          | 1 → many    | Orders placed by customer                    |
| Invoice        | 1 → many    | Invoices billed to customer                  |
| Project        | 1 → many    | Signage, branding, rollout projects          |
| Product        | many → many | Products ordered (derived via orders)        |
| Policy         | many → many | Customer-specific SLA and credit policies    |
| Branch         | many → many | Customer site locations for delivery/install |
| KPI            | many → many | Account revenue, SLA compliance KPIs         |

## Lifecycle

```
prospect → qualified → active → on_hold → active → churned → archived
```

| State       | Description                                                        |
| ----------- | ------------------------------------------------------------------ |
| `prospect`  | Identified B2B lead; no commercial activity                        |
| `qualified` | Vetted prospect; quotations permitted                              |
| `active`    | Active account; orders, contracts, and recurring schedules enabled |
| `on_hold`   | Credit hold or contract dispute; no new orders                     |
| `churned`   | Relationship ended; contract terminated                            |
| `archived`  | Record retained for audit only                                     |

## Events

| Event                                | Trigger                                       |
| ------------------------------------ | --------------------------------------------- |
| `customer.created`                   | New customer record created                   |
| `customer.qualified`                 | Customer passed qualification                 |
| `customer.activated`                 | Customer moved to active                      |
| `customer.on_hold`                   | Customer placed on hold                       |
| `customer.released`                  | Customer released from hold                   |
| `customer.churned`                   | Customer churned                              |
| `customer.archived`                  | Customer archived                             |
| `customer.contract_signed`           | Enterprise contract activated                 |
| `customer.contract_expiring`         | Contract within 90-day expiry window          |
| `customer.contract_expired`          | Contract expired                              |
| `customer.contract_renewed`          | Contract renewed                              |
| `customer.recurring_order_generated` | Recurring order auto-generated                |
| `customer.credit_limit_breached`     | Outstanding credit exceeds limit              |
| `customer.health_degraded`           | Account health dropped to at_risk or critical |
| `customer.updated`                   | Any attribute changed                         |

## Business Rules

- B2B customers of segment `enterprise` or `strategic` must have an assigned `accountManagerId`.
- Enterprise contracts (`framework`, `annual`, `multi_year`, `master_service_agreement`) require `contractStartDate`, `contractEndDate`, and `slaTier` before activation.
- Recurring orders auto-generate only when `recurringOrderEnabled` is true and the schedule status is `active`.
- Credit limit is enforced at order confirmation; `on_hold` status is set automatically on breach.
- Contract expiring within 90 days triggers proactive outreach from Sales AI.
- Custom pricing on orders uses `priceListId` or `discountTierPct`; spot customers use Product list prices.
- Churned customers retain contract and invoice history but cannot receive new quotations without requalification.
- Strategic partners require CEO AI notification on health degradation to `critical`.
