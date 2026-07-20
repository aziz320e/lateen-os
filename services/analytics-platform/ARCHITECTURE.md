# Analytics Platform Architecture

**Architecture v1.0 (locked)** · Epic 33

## Purpose

The Enterprise Analytics Platform is the unified BI layer. It aggregates metrics from existing Lateen OS services without owning business data or implementing business logic.

## System Context

```mermaid
flowchart LR
  Analytics[Analytics Platform :4011]
  DNA[Business DNA]
  Search[Search Platform]
  Knowledge[Knowledge Platform]
  Marketplace[Marketplace]
  Workforce[AI Workforce]
  Runtime[AI Runtime]
  Workflow[Workflow Engine]
  Center[Analytics Center :3011]

  DNA --> Analytics
  Search --> Analytics
  Knowledge --> Analytics
  Marketplace --> Analytics
  Workforce --> Analytics
  Runtime --> Analytics
  Workflow --> Analytics
  Center --> Analytics
```

## Pipeline

| Step | Description |
| ---- | ----------- |
| Collect | Stub collectors per domain |
| Normalize | Standardize data points |
| Aggregate | Average by metric |
| Calculate Metrics | Build snapshots |
| Generate KPIs | Dashboard KPI cards |
| Prepare Dashboard | Charts and layout |
| Return | Response with latency |

## Non-Goals

- No data warehouse
- No business logic
- No modifications to Business DNA, Workflow Engine, AI Runtime, AI Workforce, Decision Engine, Knowledge Platform, Enterprise Search

## Related Docs

- [ANALYTICS_MODEL.md](./ANALYTICS_MODEL.md)
- [REPORTS.md](./REPORTS.md)
- [DASHBOARDS.md](./DASHBOARDS.md)
