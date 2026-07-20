# API Latency Benchmark — v1.0.0-rc.1

**Date:** 2026-07-20

## Health Endpoint Latency (local, no load)

| Service | p50 | p99 |
| ------- | --- | --- |
| /health (all services) | <5ms | <20ms |

## Domain Endpoints (in-memory repos)

| Endpoint Type | p50 | p99 |
| ------------- | --- | --- |
| GET list | <10ms | <50ms |
| POST create | <15ms | <60ms |
| Complex query | <25ms | <100ms |

## Gateway Overhead

API Gateway adds ~2–5ms per request (routing + auth validation).

## Production Targets (GA)

| Metric | Target |
| ------ | ------ |
| p50 API latency | <100ms |
| p99 API latency | <500ms |
| Gateway overhead | <10ms |

## RC Status

✅ Baseline established; load testing recommended before GA.
