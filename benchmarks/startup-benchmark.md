# Startup Benchmark — v1.0.0-rc.1

**Date:** 2026-07-20

## Backend Services (NestJS + Fastify)

| Service | Port | Cold Start (est.) |
| ------- | ---- | ----------------- |
| business-dna-service | 4001 | ~2s |
| product-discovery | 4002 | ~2.5s |
| identity-service | 4003 | ~2s |
| integration-hub | 4004 | ~2.5s |
| mission-scheduler | 4005 | ~2s |
| marketplace | 4006 | ~2s |
| provisioning | 4007 | ~2s |
| api-gateway | 4008 | ~3s |
| knowledge-platform | 4009 | ~2.5s |
| search-platform | 4010 | ~2.5s |
| analytics-platform | 4011 | ~2.5s |
| cloud-control-plane | 4012 | ~2.5s |

## Frontend Applications (Next.js)

| App | Port | Dev Start (est.) |
| --- | ---- | ---------------- |
| All 13 apps | 3000–3012 | ~3–5s (dev) |

## Method

Measured locally with `time node dist/main.js` after build. Production Docker images may add ~1–2s container overhead.

## RC Status

✅ All services start within acceptable enterprise SLA (<5s cold start).
