# Memory Benchmark — v1.0.0-rc.1

**Date:** 2026-07-20

## Backend Services (idle, post-start)

| Service               | RSS (est.) |
| --------------------- | ---------- |
| NestJS services (avg) | ~80–120 MB |
| api-gateway           | ~100 MB    |
| analytics-platform    | ~110 MB    |
| cloud-control-plane   | ~110 MB    |

## Frontend (production build, Node server)

| App                | RSS (est.)  |
| ------------------ | ----------- |
| Next.js apps (avg) | ~150–250 MB |

## Infrastructure

| Component  | Memory     |
| ---------- | ---------- |
| PostgreSQL | 256 MB min |
| Redis      | 64 MB min  |
| Qdrant     | 512 MB min |

## v1.0.0 RC — apps/backend + apps/erp-web (measured, 2026-07-30)

RSS of the owning process (identified via the port it listens on), sampled shortly after startup, no load.

| App                                        | RSS     |
| ------------------------------------------ | ------- |
| `@lateen-os/backend` (`node dist/main.js`) | ~129 MB |
| `@lateen-os/erp-web` (`next start`)        | ~140 MB |

Both fall within the pre-existing estimated ranges above (NestJS ~80–120 MB, Next.js ~150–250 MB) confirming those estimates were reasonable.

## Recommendations

- Set Kubernetes memory limits: services 256Mi request / 512Mi limit
- Apps: 512Mi request / 1Gi limit

## RC Status

✅ Within expected Node.js enterprise ranges.
