# Quotation

## Purpose

A **Quotation** is a commercial offer presented to a Customer, listing products and services with proposed pricing and terms. Quotations precede orders in the sales cycle.

## Responsibilities

- Capture proposed commercial terms before commitment
- Line-item reference to products and services with quantities and prices
- Define validity period and acceptance conditions
- Serve as the source document for order conversion

## Attributes

| Attribute        | Type     | Required | Description                                                                 |
| ---------------- | -------- | -------- | --------------------------------------------------------------------------- |
| `id`             | UUID     | Yes      | Stable unique identifier                                                    |
| `organizationId` | UUID     | Yes      | Owning organization                                                         |
| `number`         | String   | Yes      | Quotation number, unique within organization                                |
| `customerId`     | UUID     | Yes      | Target customer                                                             |
| `status`         | Enum     | Yes      | `draft`, `sent`, `accepted`, `rejected`, `expired`, `cancelled`, `archived` |
| `currency`       | ISO 4217 | Yes      | Quotation currency                                                          |
| `subtotal`       | Decimal  | Yes      | Sum of line items before tax and discount                                   |
| `discount`       | Decimal  | No       | Total discount amount                                                       |
| `tax`            | Decimal  | No       | Total tax amount                                                            |
| `total`          | Decimal  | Yes      | Final quotation total                                                       |
| `validUntil`     | Date     | No       | Expiry date of the offer                                                    |
| `paymentTerms`   | String   | No       | Proposed payment terms                                                      |
| `notes`          | String   | No       | Terms, conditions, or internal notes                                        |
| `createdById`    | UUID     | Yes      | Employee who created the quotation                                          |
| `branchId`       | UUID     | No       | Originating branch                                                          |
| `sentAt`         | DateTime | No       | When quotation was sent to customer                                         |
| `acceptedAt`     | DateTime | No       | When customer accepted                                                      |
| `createdAt`      | DateTime | Yes      | Record creation timestamp                                                   |
| `updatedAt`      | DateTime | Yes      | Last modification timestamp                                                 |

### Line Item Attributes

| Attribute     | Type    | Required | Description          |
| ------------- | ------- | -------- | -------------------- |
| `lineId`      | UUID    | Yes      | Line item identifier |
| `productId`   | UUID    | No       | Referenced product   |
| `serviceId`   | UUID    | No       | Referenced service   |
| `description` | String  | Yes      | Line description     |
| `quantity`    | Decimal | Yes      | Quantity offered     |
| `unitPrice`   | Decimal | Yes      | Price per unit       |
| `discount`    | Decimal | No       | Line-level discount  |
| `total`       | Decimal | Yes      | Line total           |

## Relationships

| Related Entity | Cardinality | Description                             |
| -------------- | ----------- | --------------------------------------- |
| Organization   | many → 1    | Quotation belongs to one organization   |
| Customer       | many → 1    | Quotation is for one customer           |
| Employee       | many → 1    | Created by employee                     |
| Branch         | many → 1    | Originating branch                      |
| Product        | many → many | Products on line items                  |
| Service        | many → many | Services on line items                  |
| Order          | 1 → 1       | Accepted quotation converts to an order |
| Workflow       | many → 1    | Approval workflow if required           |

## Lifecycle

```
draft → sent → accepted → (converts to order) → archived
          ↓
       rejected → archived
          ↓
       expired → archived
          ↓
       cancelled → archived
```

| State       | Description                                   |
| ----------- | --------------------------------------------- |
| `draft`     | Quotation being prepared                      |
| `sent`      | Quotation delivered to customer               |
| `accepted`  | Customer accepted; ready for order conversion |
| `rejected`  | Customer declined                             |
| `expired`   | Validity period passed without acceptance     |
| `cancelled` | Quotation withdrawn by organization           |
| `archived`  | Record retained for audit only                |

## Events

| Event                 | Trigger                      |
| --------------------- | ---------------------------- |
| `quotation.created`   | New quotation created        |
| `quotation.sent`      | Quotation sent to customer   |
| `quotation.accepted`  | Customer accepted quotation  |
| `quotation.rejected`  | Customer rejected quotation  |
| `quotation.expired`   | Quotation expired            |
| `quotation.cancelled` | Quotation cancelled          |
| `quotation.converted` | Quotation converted to order |
| `quotation.archived`  | Quotation archived           |
| `quotation.updated`   | Any attribute changed        |

## Business Rules

- Quotation `number` must be unique within the organization.
- Each line item must reference a product or a service, not both.
- Sent quotations cannot be edited; revisions require a new quotation.
- Accepted quotations may produce exactly one order.
- Expired quotations cannot be accepted without extension and re-send.
- Total must equal subtotal minus discount plus tax.
