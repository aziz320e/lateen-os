# Invoice

## Purpose

An **Invoice** is a billing document issued to a Customer (or received from a Supplier) for delivered goods or services. Invoices represent financial claims and payment obligations.

## Responsibilities

- Record amounts owed or payable with line-item detail
- Link to orders, projects, and commercial transactions
- Track payment status and due dates
- Feed finance domain reporting and KPI measurement

## Attributes

| Attribute        | Type     | Required | Description                                                                        |
| ---------------- | -------- | -------- | ---------------------------------------------------------------------------------- |
| `id`             | UUID     | Yes      | Stable unique identifier                                                           |
| `organizationId` | UUID     | Yes      | Owning organization                                                                |
| `number`         | String   | Yes      | Invoice number, unique within organization                                         |
| `type`           | Enum     | Yes      | `sales`, `purchase`, `credit_note`, `debit_note`                                   |
| `status`         | Enum     | Yes      | `draft`, `issued`, `sent`, `partially_paid`, `paid`, `overdue`, `void`, `archived` |
| `customerId`     | UUID     | No       | Customer billed (sales invoices)                                                   |
| `supplierId`     | UUID     | No       | Supplier billing the org (purchase invoices)                                       |
| `orderId`        | UUID     | No       | Source order                                                                       |
| `currency`       | ISO 4217 | Yes      | Invoice currency                                                                   |
| `subtotal`       | Decimal  | Yes      | Sum before tax and discount                                                        |
| `discount`       | Decimal  | No       | Total discount                                                                     |
| `tax`            | Decimal  | No       | Total tax                                                                          |
| `total`          | Decimal  | Yes      | Invoice total                                                                      |
| `amountPaid`     | Decimal  | No       | Amount paid to date                                                                |
| `amountDue`      | Decimal  | Yes      | Remaining balance                                                                  |
| `issueDate`      | Date     | Yes      | Date invoice was issued                                                            |
| `dueDate`        | Date     | No       | Payment due date                                                                   |
| `paidAt`         | DateTime | No       | When fully paid                                                                    |
| `branchId`       | UUID     | No       | Issuing branch                                                                     |
| `createdAt`      | DateTime | Yes      | Record creation timestamp                                                          |
| `updatedAt`      | DateTime | Yes      | Last modification timestamp                                                        |

### Line Item Attributes

| Attribute     | Type    | Required | Description          |
| ------------- | ------- | -------- | -------------------- |
| `lineId`      | UUID    | Yes      | Line item identifier |
| `productId`   | UUID    | No       | Billed product       |
| `serviceId`   | UUID    | No       | Billed service       |
| `description` | String  | Yes      | Line description     |
| `quantity`    | Decimal | Yes      | Quantity billed      |
| `unitPrice`   | Decimal | Yes      | Price per unit       |
| `total`       | Decimal | Yes      | Line total           |

## Relationships

| Related Entity | Cardinality | Description                         |
| -------------- | ----------- | ----------------------------------- |
| Organization   | many → 1    | Invoice belongs to one organization |
| Customer       | many → 1    | Customer on sales invoices          |
| Supplier       | many → 1    | Supplier on purchase invoices       |
| Order          | many → 1    | Source order                        |
| Product        | many → many | Products on line items              |
| Service        | many → many | Services on line items              |
| Branch         | many → 1    | Issuing branch                      |
| KPI            | many → many | Revenue and receivables KPIs        |
| Policy         | many → many | Billing policies applied            |

## Lifecycle

```
draft → issued → sent → partially_paid → paid → archived
                  ↓
               overdue → partially_paid → paid → archived
                  ↓
                void → archived
```

| State            | Description                               |
| ---------------- | ----------------------------------------- |
| `draft`          | Invoice being prepared                    |
| `issued`         | Invoice finalized internally              |
| `sent`           | Invoice delivered to customer or supplier |
| `partially_paid` | Partial payment received                  |
| `paid`           | Fully paid                                |
| `overdue`        | Past due date with outstanding balance    |
| `void`           | Invoice voided; no payment expected       |
| `archived`       | Record retained for audit only            |

## Events

| Event                      | Trigger                          |
| -------------------------- | -------------------------------- |
| `invoice.created`          | New invoice created              |
| `invoice.issued`           | Invoice issued                   |
| `invoice.sent`             | Invoice sent to party            |
| `invoice.payment_received` | Partial or full payment recorded |
| `invoice.paid`             | Invoice fully paid               |
| `invoice.overdue`          | Invoice passed due date unpaid   |
| `invoice.voided`           | Invoice voided                   |
| `invoice.archived`         | Invoice archived                 |
| `invoice.updated`          | Any attribute changed            |

## Business Rules

- Invoice `number` must be unique within the organization.
- Sales invoices require an active customer; purchase invoices require an approved supplier.
- Void invoices cannot be reissued; a credit note or new invoice is required.
- `amountDue` must equal `total` minus `amountPaid` at all times.
- Overdue status is set automatically when `dueDate` passes with outstanding balance.
- Issued invoices cannot be edited; corrections use credit or debit notes.
