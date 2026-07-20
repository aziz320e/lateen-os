# Compatibility Matrix — v1.0.0-rc.1

**Date:** 2026-07-20

## Platform Versions

| Component | Version |
| --------- | ------- |
| Lateen OS | 1.0.0-rc.1 |
| Node.js | ≥22 |
| pnpm | ≥9 |
| TypeScript | ^5.8 |
| Turbo | ^2.5 |

## Package Compatibility

| Package | Peer Deps | Workspace Refs | Status |
| ------- | --------- | -------------- | ------ |
| @lateen-os/kernel | sdk, extension-system | ✅ | ✅ |
| @lateen-os/sdk | kernel | ✅ | ✅ |
| @lateen-os/extension-system | kernel, sdk | ✅ | ✅ |
| All domain packages | shared-kernel | ✅ | ✅ |
| All services | domain packages | ✅ | ✅ |
| All apps | sdk, kernel | ✅ | ✅ |

## Extension Compatibility

| Extension | SDK Version | Manifest Schema | Status |
| --------- | ----------- | --------------- | ------ |
| All 19 extensions | 1.0.0 | v1 | ✅ |

## SDK Template Compatibility

| Template | SDK | Status |
| -------- | --- | ------ |
| extension-template | 1.0.0 | ✅ |
| service-template | 1.0.0 | ✅ |
| app-template | 1.0.0 | ✅ |

## Known Issue

Turbo cyclic dependency prevents root-level `pnpm build`. Per-package builds pass via phased validation.

## RC Status

✅ Pass — all workspace references resolve; extension manifest schema v1 frozen.
