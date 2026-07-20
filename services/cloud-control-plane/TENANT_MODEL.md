# Tenant Model

## Lifecycle Actions

| Action | Resulting Status |
| ------ | ---------------- |
| provision | provisioning |
| activate | active |
| suspend | suspended |
| resume | active |
| upgrade | active (plan change) |
| downgrade | active (plan change) |
| archive | archived |
| delete | deleted |

## Subscription Plans

| Plan | Max Users | Storage | AI Tokens | Price |
| ---- | --------- | ------- | --------- | ----- |
| Community | 5 | 1 GB | 10K | $0 |
| Starter | 25 | 10 GB | 100K | $49 |
| Professional | 100 | 50 GB | 1M | $199 |
| Enterprise | 1000 | 500 GB | 10M | $999 |
| Partner | 5000 | 2 TB | 50M | custom |

## Regions

US · Europe · Middle East · Asia · Custom

## Deployment Environments

Development · Testing · Staging · Production

## Orchestration

Tenant provisioning delegates to **Provisioning service** (stub). User binding delegates to **Identity service** (stub).

## Prisma Schema

Data model in `prisma/schema.prisma` — OrganizationRecord, TenantRecord, SubscriptionRecord, DeploymentRecord, etc.
