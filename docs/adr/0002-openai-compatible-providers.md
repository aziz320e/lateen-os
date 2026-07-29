# ADR 0002: AI Providers Must Be OpenAI-Compatible and Provider-Agnostic

## Status

Accepted

## Context

Lateen OS relies on LLM providers for conversation, planning, and structured-output generation throughout `ai-runtime`. The LLM provider landscape changes quickly — pricing, capability, and availability shift, and locking business logic to one vendor's SDK or wire format creates risk and makes testing dependent on live network access.

## Decision

All LLM access goes through `ai-provider-hub`, which exposes provider-agnostic, OpenAI-compatible interfaces (chat, embeddings, structured-output parsing) as the single integration surface. Business logic (`decision-engine`, `intelligence-engine`, `ai-runtime`) depends only on these interfaces, never on a specific provider's SDK or response format. Providers are interchangeable implementations registered behind the same contract.

## Consequences

- Switching or adding a provider requires a new adapter in `ai-provider-hub` only — no changes to business logic.
- Tests for provider-consuming code use fake implementations of the shared interface, keeping the suite offline and deterministic.
- Provider-specific features that don't fit the OpenAI-compatible contract are deliberately not exposed to business logic unless they're generalized into the shared interface first.
