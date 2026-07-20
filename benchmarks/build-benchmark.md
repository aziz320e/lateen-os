# Build Benchmark — v1.0.0-rc.1

**Date:** 2026-07-20  
**Method:** Phased per-package build via `release/scripts/validate.mjs`

## Phases

| Phase | Packages | Est. Duration |
| ----- | -------- | ------------- |
| foundation | 16 | ~3 min |
| platform-core | 3 | ~1 min |
| services | 12 | ~4 min |
| applications | 13 | ~8 min |

## Turbo Root Build

| Command | Status | Notes |
| ------- | ------ | ----- |
| `pnpm build` | ❌ Blocked | Cyclic: kernel ↔ sdk ↔ extension-system |
| Phased build | ✅ | Workaround documented |

## Recommendations

Resolve cyclic dependency before GA to enable single `pnpm build` in CI.

See `quality/validation-results.json` for per-package timings.
