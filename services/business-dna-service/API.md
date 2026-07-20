# Business DNA API

> REST API v1 — OpenAPI at `/docs`

## Base URL

```
http://localhost:4001/api/v1
```

## Authentication

| Mode | Header |
| ---- | ------ |
| Development token | `Authorization: Bearer dev:<orgId>:<subject>` |
| Keycloak-ready | `Authorization: Bearer <jwt>` (requires Keycloak validator) |
| Org context | `X-Organization-Id: <uuid>` |

## Organization endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/organizations/:id` | Get organization |
| POST | `/organizations` | Create organization |
| PUT | `/organizations/:id` | Update organization |
| DELETE | `/organizations/:id` | Delete organization |

## Tenant-scoped endpoints

All other aggregates follow:

```
/api/v1/organizations/:organizationId/{resource}
/api/v1/organizations/:organizationId/{resource}/:id
```

| Resource | Path segment |
| -------- | ------------ |
| Branches | `branches` |
| Departments | `departments` |
| Employees | `employees` |
| Roles | `roles` |
| Permissions | `permissions` |
| Customers | `customers` |
| Suppliers | `suppliers` |
| Products | `products` |
| Services | `services` |
| Machines | `machines` |
| Projects | `projects` |
| Quotations | `quotations` |
| Orders | `orders` |
| Invoices | `invoices` |
| Workflows | `workflows` |
| Policies | `policies` |
| KPIs | `kpis` |
| Assets | `assets` |
| Agents | `agents` |

## Operations

Each resource supports standard CRUD:

- `GET` — retrieve by ID
- `POST` — create
- `PUT` — update
- `DELETE` — remove

## Validation

Request bodies are validated with **Zod** schemas in `src/validation/schemas.ts`.

Enrichment fields (customer contracts, product AI metadata, etc.) are accepted via `.passthrough()` and stored in JSON `data` columns.

## Events

Create/update/delete operations publish domain events to NATS:

```
{subjectPrefix}.{entity}_{action}
```

Default subject prefix: `lateen.business-dna`

## Observability

| Endpoint | Purpose |
| -------- | ------- |
| `GET /health` | Liveness |
| `GET /metrics` | Metrics pointer (OTel) |
| `GET /docs` | Swagger UI |

## Authorization

Authorization uses Decision Engine policy contracts via `AuthorizationProvider`. Development mode allows all authenticated requests.

## Error responses

| Status | Meaning |
| ------ | ------- |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 400 | Validation error |
