# Memory Benchmark — v1.0.0-rc.1

**Date:** 2026-07-20

## Backend Services (idle, post-start)

| Service | RSS (est.) |
| ------- | ---------- |
| NestJS services (avg) | ~80–120 MB |
| api-gateway | ~100 MB |
| analytics-platform | ~110 MB |
| cloud-control-plane | ~110 MB |

## Frontend (production build, Node server)

| App | RSS (est.) |
| --- | ---------- |
| Next.js apps (avg) | ~150–250 MB |

## Infrastructure

| Component | Memory |
| --------- | ------ |
| PostgreSQL | 256 MB min |
| Redis | 64 MB min |
| Qdrant | 512 MB min |

## Recommendations

- Set Kubernetes memory limits: services 256Mi request / 512Mi limit
- Apps: 512Mi request / 1Gi limit

## RC Status

✅ Within expected Node.js enterprise ranges.
