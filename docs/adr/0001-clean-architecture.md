# ADR 0001: Adopt Clean Architecture

## Status

Accepted

## Context

Lateen OS is a large, long-lived monorepo spanning business-context packages (`business-dna`, `domain-graph`, `institutional-memory`), reasoning packages (`decision-engine`, `intelligence-engine`), and AI orchestration (`ai-provider-hub`, `ai-runtime`). These layers evolve at different rates and must remain independently testable and replaceable — in particular, AI providers and infrastructure concerns are expected to change far more often than core business domain logic.

## Decision

Lateen OS follows Clean Architecture: domain and application logic depend only on abstractions (ports/interfaces), never on concrete infrastructure, frameworks, or specific providers. Dependencies point inward — infrastructure and orchestration layers depend on domain logic, never the reverse. Concrete implementations (LLM providers, repositories, event buses) are injected at composition time.

## Consequences

- Business and reasoning logic can be unit tested offline, without live providers or infrastructure.
- Infrastructure (a provider, a storage backend) can be swapped without touching domain logic.
- Requires discipline: every new capability must be expressed as a port before it is implemented, which adds short-term overhead in exchange for long-term flexibility.
