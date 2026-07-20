# @lateen-os/shared-kernel

Shared Kernel — foundational DDD building blocks for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**. This package sits below Business DNA and all other domain packages.

## Scope

| Included | Excluded |
| -------- | -------- |
| Entity, AggregateRoot, ValueObject | Business entities |
| DomainEvent, DomainError, Result | Event bus implementations |
| Guard, Specification contracts | HTTP / API |
| UUID, Identifier | Database / ORM |
| Money, Address, Email, Phone, … | UI |
| AuditInfo, VersionInfo | Frameworks |
| TenantId, OrganizationId, BranchId | Business logic |
| Timestamp, Clock port | Persistence |

## Usage

```typescript
import {
  core,
  common,
  tenant,
  type Entity,
  type Result,
  ok,
  err,
} from '@lateen-os/shared-kernel';

// Namespace access
const money: common.Money = { amount: '100.00', currency: 'SAR' };

// Subpath imports
import type { Clock } from '@lateen-os/shared-kernel/time';
import type { Specification } from '@lateen-os/shared-kernel/core';
```

## Modules

| Module | Purpose |
| ------ | ------- |
| `core/` | Entity, AggregateRoot, ValueObject, DomainEvent, DomainError, Result, Guard, Specification |
| `identity/` | UUID, Identifier |
| `common/` | Money, Address, Email, Phone, Percentage, TimeRange, GeoLocation |
| `audit/` | AuditInfo, VersionInfo |
| `tenant/` | TenantId, OrganizationId, BranchId |
| `time/` | Timestamp, DateOnly, Clock port |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for dependency rules and integration guidance.

## Build

```bash
pnpm --filter @lateen-os/shared-kernel build
pnpm --filter @lateen-os/shared-kernel typecheck
```

## Consumers

- `@lateen-os/business-dna` — re-exports shared primitives for backward compatibility
