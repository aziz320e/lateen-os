# API Latency Benchmark — v1.0.0-rc.1

**Date:** 2026-07-20

## Health Endpoint Latency (local, no load)

| Service                | p50  | p99   |
| ---------------------- | ---- | ----- |
| /health (all services) | <5ms | <20ms |

## Domain Endpoints (in-memory repos)

| Endpoint Type | p50   | p99    |
| ------------- | ----- | ------ |
| GET list      | <10ms | <50ms  |
| POST create   | <15ms | <60ms  |
| Complex query | <25ms | <100ms |

## Gateway Overhead

API Gateway adds ~2–5ms per request (routing + auth validation).

## Production Targets (GA)

| Metric           | Target |
| ---------------- | ------ |
| p50 API latency  | <100ms |
| p99 API latency  | <500ms |
| Gateway overhead | <10ms  |

## v1.0.0 RC — apps/backend (measured, 2026-07-30)

10-sample `curl` timings against a locally running instance (`http://127.0.0.1:4013`, no load). Note: sampling via `http://localhost:...` on this sandbox added a consistent ~200ms of DNS-resolution overhead unrelated to server response time (a Windows IPv6-then-IPv4 fallback quirk) — figures below use `127.0.0.1` directly to avoid that artifact.

| Endpoint                                      | Min   | Max    | Notes                                                                                                  |
| --------------------------------------------- | ----- | ------ | ------------------------------------------------------------------------------------------------------ |
| `GET /version`                                | 1.3ms | 2.5ms  | Liveness probe — no dependency checks                                                                  |
| `GET /health`                                 | 1.3ms | 20.1ms | Readiness probe — aggregates all 27 hosted engine runtimes + observability; one outlier sample at 20ms |
| `GET /api/v1/crm/customers` (unauthenticated) | 1.4ms | 21.8ms | Real v1 REST route, returns 401 before touching the database                                           |

## RC Status

✅ Baseline established; load testing recommended before GA.
