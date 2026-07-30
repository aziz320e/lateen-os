# Build Benchmark — v1.0.0-rc.1

**Date:** 2026-07-20  
**Method:** Phased per-package build via `release/scripts/validate.mjs`

## Phases

| Phase         | Packages | Est. Duration |
| ------------- | -------- | ------------- |
| foundation    | 16       | ~3 min        |
| platform-core | 3        | ~1 min        |
| services      | 12       | ~4 min        |
| applications  | 13       | ~8 min        |

## Turbo Root Build

| Command      | Status     | Notes                                   |
| ------------ | ---------- | --------------------------------------- |
| `pnpm build` | ❌ Blocked | Cyclic: kernel ↔ sdk ↔ extension-system |
| Phased build | ✅         | Workaround documented                   |

## Recommendations

Resolve cyclic dependency before GA to enable single `pnpm build` in CI.

See `quality/validation-results.json` for per-package timings.

## v1.0.0 RC — apps/backend + apps/erp-web (measured, 2026-07-30)

Actual, measured build times for the two applications delivered in this release (not estimates), run directly via each app's own `pnpm build` (bypasses the root Turbo graph — see note below).

| Package              | Command                  | Wall-clock time |
| -------------------- | ------------------------ | --------------- |
| `@lateen-os/backend` | `prisma generate && tsc` | 11.0s           |
| `@lateen-os/erp-web` | `next build`             | 40.5s           |

**Root Turbo build is still blocked, for a second, separate reason.** In addition to the pre-existing kernel↔sdk↔extension-system cycle noted above, this session found `packages/ai-brain` and `packages/multi-agent` also declare each other as `workspace:*` dependencies — a second real cycle, confirmed via `turbo run build --dry-run` (unfiltered, and filtered to `@lateen-os/backend`, which depends on `ai-brain`). `turbo run build --filter=@lateen-os/erp-web` (no `ai-brain`/`multi-agent` in its graph) succeeds cleanly. Neither cycle was introduced or touched this session; fixing either requires editing packages outside this session's scope (`ai-brain`, `multi-agent`, `kernel`, `sdk`, `extension-system`) and is recommended as a P0 for v1.1 — see `release/KNOWN_LIMITATIONS.md`.
