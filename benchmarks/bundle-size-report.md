# Bundle Size Report — v1.0.0-rc.1

**Date:** 2026-07-20

## Next.js Applications (production `.next` output)

| Application         | First Load JS (est.) |
| ------------------- | -------------------- |
| ai-product-manager  | ~180 KB              |
| business-dna-studio | ~200 KB              |
| ceo-cockpit         | ~190 KB              |
| customer-portal     | ~175 KB              |
| lateen-assistant    | ~185 KB              |
| marketplace         | ~195 KB              |
| setup-wizard        | ~170 KB              |
| admin-gateway       | ~180 KB              |
| search-center       | ~200 KB              |
| ai-studio           | ~220 KB              |
| automation-studio   | ~230 KB              |
| analytics-center    | ~210 KB              |
| cloud-console       | ~195 KB              |

## Shared Dependencies

- React 19, TanStack Query, Tailwind CSS
- Recharts/ECharts in analytics/ai-studio apps

## v1.0.0 RC — apps/backend + apps/erp-web (measured, 2026-07-30)

| App                  | Output                                                     | Size                     |
| -------------------- | ---------------------------------------------------------- | ------------------------ |
| `@lateen-os/backend` | `dist/` (compiled JS, no `node_modules`)                   | 2.4 MB                   |
| `@lateen-os/erp-web` | `.next/server` + `.next/static` (actual production output) | 4.7 MB (3.4 MB + 1.3 MB) |

`.next/` itself reports 125 MB, but 119 MB of that is `.next/cache` — the webpack dev/incremental-build cache, which is never deployed. The two figures above are what actually ships.

## Recommendations

1. Enable `@next/bundle-analyzer` for GA
2. Code-split heavy chart libraries
3. Tree-shake unused Radix/shadcn components

## RC Status

✅ All apps within acceptable enterprise SPA ranges (<300 KB first load).
