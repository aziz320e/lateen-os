# Order

## Purpose

An **Order** is a confirmed request from a Customer for products or services. Orders represent commercial commitment after quotation acceptance or direct placement.

## Responsibilities

- Capture confirmed commercial transaction details
- Drive fulfillment, delivery, and invoicing workflows
- Line-item reference to products and services with committed quantities and prices
- Link to projects when delivery spans a longer initiative

## Attributes

| Attribute        | Type     | Required | Description                                                                                      |
| ---------------- | -------- | -------- | ------------------------------------------------------------------------------------------------ |
| `id`             | UUID     | Yes      | Stable unique identifier                                                                         |
| `organizationId` | UUID     | Yes      | Owning organization                                                                              |
| `number`         | String   | Yes      | Order number, unique within organization                                                         |
| `customerId`     | UUID     | Yes      | Customer placing the order                                                                       |
| `quotationId`    | UUID     | No       | Source quotation if converted                                                                    |
| `status`         | Enum     | Yes      | `draft`, `confirmed`, `in_progress`, `fulfilled`, `partially_fulfilled`, `cancelled`, `archived` |
| `currency`       | ISO 4217 | Yes      | Order currency                                                                                   |
| `subtotal`       | Decimal  | Yes      | Sum of line items before tax and discount                                                        |
| `discount`       | Decimal  | No       | Total discount amount                                                                            |
| `tax`            | Decimal  | No       | Total tax amount                                                                                 |
| `total`          | Decimal  | Yes      | Final order total                                                                                |
| `paymentTerms`   | String   | No       | Agreed payment terms                                                                             |
| `deliveryDate`   | Date     | No       | Expected delivery or completion date                                                             |
| `ownerId`        | UUID     | No       | Employee responsible for the order                                                               |
| `branchId`       | UUID     | No       | Fulfilling branch                                                                                |
| `projectId`      | UUID     | No       | Linked project for delivery                                                                      |
| `confirmedAt`    | DateTime | No       | When order was confirmed                                                                         |
| `fulfilledAt`    | DateTime | No       | When order was fully fulfilled                                                                   |
| `createdAt`      | DateTime | Yes      | Record creation timestamp                                                                        |
| `updatedAt`      | DateTime | Yes      | Last modification timestamp                                                                      |

### Line Item Attributes

| Attribute           | Type    | Required | Description                |
| ------------------- | ------- | -------- | -------------------------- |
| `lineId`            | UUID    | Yes      | Line item identifier       |
| `productId`         | UUID    | No       | Ordered product            |
| `serviceId`         | UUID    | No       | Ordered service            |
| `description`       | String  | Yes      | Line description           |
| `quantity`          | Decimal | Yes      | Quantity ordered           |
| `unitPrice`         | Decimal | Yes      | Agreed price per unit      |
| `discount`          | Decimal | No       | Line-level discount        |
| `total`             | Decimal | Yes      | Line total                 |
| `fulfilledQuantity` | Decimal | No       | Quantity fulfilled to date |

## Relationships

| Related Entity | Cardinality | Description                       |
| -------------- | ----------- | --------------------------------- |
| Organization   | many → 1    | Order belongs to one organization |
| Customer       | many → 1    | Customer who placed the order     |
| Quotation      | many → 1    | Source quotation                  |
| Employee       | many → 1    | Order owner                       |
| Branch         | many → 1    | Fulfilling branch                 |
| Project        | many → 1    | Delivery project                  |
| Product        | many → many | Products on line items            |
| Service        | many → many | Services on line items            |
| Invoice        | 1 → many    | Invoices generated from order     |
| Workflow       | many → 1    | Fulfillment workflow              |

## Lifecycle

```
draft → confirmed → in_progress → fulfilled → archived
                        ↓
              partially_fulfilled → fulfilled → archived
                        ↓
                   cancelled → archived
```

| State                 | Description                             |
| --------------------- | --------------------------------------- |
| `draft`               | Order being prepared                    |
| `confirmed`           | Order committed; fulfillment may begin  |
| `in_progress`         | Fulfillment underway                    |
| `partially_fulfilled` | Some line items fulfilled               |
| `fulfilled`           | All line items fully delivered          |
| `cancelled`           | Order cancelled before full fulfillment |
| `archived`            | Record retained for audit only          |

## Events

| Event                       | Trigger                      |
| --------------------------- | ---------------------------- |
| `order.created`             | New order created            |
| `order.confirmed`           | Order confirmed              |
| `order.fulfillment_started` | Fulfillment began            |
| `order.partially_fulfilled` | Partial fulfillment recorded |
| `order.fulfilled`           | Order fully fulfilled        |
| `order.cancelled`           | Order cancelled              |
| `order.archived`            | Order archived               |
| `order.updated`             | Any attribute changed        |

## Business Rules

- Order `number` must be unique within the organization.
- Confirmed orders cannot be edited; changes require cancellation and re-order or amendment workflow.
- Customer credit limit is enforced at confirmation when defined.
- Each line item must reference a product or a service, not both.
- Fulfilled orders trigger invoice generation per organization policy.
- Cancelled orders cannot be reconfirmed; a new order is required.
