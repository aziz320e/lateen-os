# Billing Model

## Components

| Component | Description |
| --------- | ----------- |
| Subscriptions | Plan-based recurring billing |
| Invoices | Period-based billing records |
| Payments | Stub only — no payment gateway |
| Licenses | Plan entitlements |
| Marketplace Purchases | Extension billing (contract) |
| Usage Billing | Metered usage charges |

## Invoice Statuses

draft · open · paid · void

## Usage Metrics

users · storage · api-calls · ai-tokens · marketplace-extensions · connectors · workers · workflows · knowledge-size · search-queries

## Payment Stub

`POST /api/billing/pay/:invoiceId` returns a stub response. No Stripe/PayPal implementation in Epic 34.
