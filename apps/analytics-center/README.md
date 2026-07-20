# Analytics Center

Enterprise BI UI for Lateen OS — consumes Analytics Platform API.

## Development

```bash
pnpm --filter @lateen-os/analytics-center dev    # http://localhost:3011
```

Requires Analytics Platform running on port 4011 for live data.

## Sections

Overview · Dashboards · Reports · Alerts · Exports · Metrics

## Technology

Next.js 15 · React 19 · Recharts · Apache ECharts · TanStack Query

## BFF API

Proxies to Analytics Platform at `NEXT_PUBLIC_LATEEN_ANALYTICS_BASE_URL` (default `http://localhost:4011`).

## Port

**3011**
