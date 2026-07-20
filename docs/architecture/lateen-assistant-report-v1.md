# Lateen Assistant — Architecture Report v1

**Epic 16** | Port **3004** | Status: **Completed**

## Summary

Lateen Assistant (`apps/lateen-assistant`) is the unified conversational interface for Lateen OS. It orchestrates all platform services through a BFF layer with chat, mission console, workflow console, knowledge/memory/decision explorers, and a global command palette.

## Deliverables

| Area | Status |
| ---- | ------ |
| Next.js 15 + React 19 scaffold | Done |
| Chat with streaming, markdown, charts, tables, code | Done |
| 14 slash commands + natural language aliases | Done |
| Mission Console (start/retry/escalate) | Done |
| Workflow Console (start/pause/resume/cancel) | Done |
| Knowledge + Memory + Decision explorers | Done |
| Command palette (⌘K) | Done |
| BFF routes (chat, missions, workflows, search, memory, commands, context) | Done |
| Service integration (BDS, Discovery, AI PM, Cockpit, Integration Hub) | Done |
| Audit trace correlation | Done |
| Tests + documentation | Done |

## Port map

| App | Port |
| --- | ---- |
| Lateen Assistant | **3004** |

## Verification

```bash
pnpm --filter @lateen-os/lateen-assistant build
pnpm --filter @lateen-os/lateen-assistant typecheck
pnpm --filter @lateen-os/lateen-assistant test
```

## Constraints honored

- No business logic in the assistant layer
- No modifications to existing packages
- No direct database access
- All actions routed through existing service APIs
