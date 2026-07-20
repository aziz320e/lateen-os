# Product Discovery Service — Architecture Report (Epic 1)

> **Date:** 2026-07-18  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked) — First Executable Service

## Executive summary

Epic 1 introduces `@lateen-os/product-discovery-service`, the **first executable service** of Lateen OS. The Product Discovery Platform discovers manufacturable business opportunities by orchestrating a seven-stage workflow across eight market signal adapter contracts and seven Lateen OS platform packages. Service interfaces only — no external APIs, LLM integration, or persistence.

## Deliverables

| Item | Status |
| ---- | ------ |
| `services/product-discovery` service | Done |
| Hexagonal structure (7 layers) | Done |
| 8 signal source adapter contracts | Done |
| 7-stage workflow interfaces | Done |
| Inbound + 8 outbound ports | Done |
| Domain model (10 type groups) | Done |
| Contract tests (typecheck) | Done |
| README, ARCHITECTURE, WORKFLOW | Done |
| Typecheck | Passed |

## Goal

Discover new business opportunities that Lateen can manufacture using **existing capabilities**.

## Service structure

```
services/product-discovery/
├── src/
│   ├── domain/
│   ├── ports/         (inbound + outbound)
│   ├── adapters/      (8 sources)
│   ├── workflows/     (7 stages)
│   ├── application/
│   ├── infrastructure/
│   ├── index.ts
│   └── main.ts
└── tests/
    ├── adapters/
    └── contracts/
```

## Workflow

Collect Signals → Normalize → Rank → Capability Matching → Profit Estimation → Decision Submission → Recommendation

## Adapter contracts

Google Trends, TikTok, Instagram, Alibaba, Etsy, Amazon, Temu, Noon

## Platform consumption

| Package | Port |
| ------- | ---- |
| business-dna | `BusinessDnaPort` |
| capability-engine | `CapabilityEnginePort` |
| domain-graph | `DomainGraphPort` |
| institutional-memory | `InstitutionalMemoryPort` |
| decision-engine | `DecisionEnginePort` |
| intelligence-engine | `IntelligenceEnginePort` |
| ai-runtime | `AiRuntimePort` |

## Key domain types

`MarketSignal`, `NormalizedSignal`, `RankedOpportunity`, `CapabilityMatch`, `ProfitEstimate`, `DecisionSubmission`, `DiscoveryRecommendation`, `ProductDiscoveryRun`

## Inbound port

`ProductDiscoveryService`: `runDiscovery`, `getRun`, `listRecommendations`

## Architectural boundaries

- **Not** an LLM service — no OpenAI, no Claude
- **Not** persistence — no database or ORM
- **Not** external APIs — adapter implementations are future work
- **Decision Engine decides** — service submits, never executes business decisions

## Verification

```
pnpm install
pnpm typecheck
```

## References

- [Lateen OS Architecture v1.0](./lateen-os-v1.md)
- [Service ARCHITECTURE.md](../services/product-discovery/ARCHITECTURE.md)
- [Service WORKFLOW.md](../services/product-discovery/WORKFLOW.md)
- [AI Runtime Report](./ai-runtime-report-v1.md)
