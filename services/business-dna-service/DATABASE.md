# Database

> PostgreSQL + Prisma — Business DNA persistence

## Schema

Prisma schema: `prisma/schema.prisma`

20 aggregate tables:

| Table | Aggregate |
| ----- | --------- |
| Organization | Organization (tenant root) |
| Branch | Branch |
| Department | Department |
| Employee | Employee |
| Role | Role |
| Permission | Permission |
| Customer | Customer |
| Supplier | Supplier |
| Product | Product |
| Service | Service |
| Machine | Machine |
| Project | Project |
| Quotation | Quotation |
| Order | Order |
| Invoice | Invoice |
| Workflow | Workflow |
| Policy | Policy |
| Kpi | KPI |
| Asset | Asset |
| Agent | Agent |

## JSON columns

Enrichment and nested value objects are stored in `data` JSON columns (and dedicated JSON fields like `lineItems`, `stages`, `industryVerticals`) to preserve the full Business DNA domain model without schema explosion.

## Migrations

```bash
# Development
pnpm --filter @lateen-os/business-dna-service db:migrate

# Production deploy
pnpm --filter @lateen-os/business-dna-service db:migrate:deploy
```

Migration files: `prisma/migrations/`

## Seed

```bash
pnpm --filter @lateen-os/business-dna-service db:seed
```

Creates default organization `LATEEN`.

## Connection

Uses `DATABASE_URL` from environment:

```
postgresql://lateen:lateen_dev_postgres@localhost:5432/lateen_os
```

Aligned with `infrastructure/environments/.env.development`.

## Repository mapping

Prisma repositories in `src/repositories/` implement every port from `@lateen-os/business-dna`:

- `OrganizationRepository.findByCode`
- `BranchRepository.findByOrganization`
- `EmployeeRepository.findByEmail`
- `ProductRepository.findByCategory`
- … (all custom query methods)

## Module

Database access is centralized in `src/database/prisma-client.ts`.
