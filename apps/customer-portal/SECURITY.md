# Customer Portal — Security

## Tenant Isolation

- Every BFF data route requires `customerId`
- All list responses filtered by `customerId`
- Single-entity reads verify `entity.customerId === session.customerId`
- Cross-customer access returns HTTP 403

## Authentication

- Identity Service JWT stored in **httpOnly** cookies
- Refresh token in separate cookie with restricted path
- Browser JavaScript cannot read tokens
- Logout revokes refresh token via Identity Service

## Customer Linking

On login, portal resolves Business DNA customer by matching user email. Users without a linked customer account receive HTTP 403.

## AI Assistant

- Only scoped project/order/quotation data passed to reply builder
- No internal org data, employee records, or cross-customer data
- Disclaimer shown on every response

## Data Access Boundaries

Customers can access **only**:

- Own organization context (via auth)
- Own customer record
- Own projects, quotations, orders, invoices
- Own files and messages (derived from scoped entities)

Customers **cannot**:

- List other customers
- View other customers' projects or orders
- Access internal Business DNA administration

## Dev Mode

`LATEEN_CUSTOMER_ID` env var enables local development without Identity Service. **Never use in production.**
