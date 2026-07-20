# Provisioning API

## POST /api/provision

```json
{
  "organizationName": "Acme Print",
  "profile": "printing",
  "industry": "printing",
  "country": "SA",
  "timezone": "Asia/Riyadh",
  "currency": "SAR",
  "language": "en",
  "employeeCount": 25,
  "extensions": ["stripe-connector", "printing-industry"],
  "aiWorkers": ["printing-planner"]
}
```

## GET /api/provision/:id

Returns full job with steps and report.

## GET /api/provision/status

Returns `{ total, pending, running, completed, failed }`.

## GET /api/profiles

Returns available provisioning profiles.
