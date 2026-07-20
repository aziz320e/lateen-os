# Core

The **Core** domain provides platform capabilities shared across all Lateen OS domains.

Core services are cross-cutting infrastructure — identity, security, messaging, and system plumbing — that business domains depend on but do not own.

## Capabilities

| Capability                          | Responsibility                                          |
| ----------------------------------- | ------------------------------------------------------- |
| [identity](./identity/)             | Canonical representation of users, actors, and entities |
| [authentication](./authentication/) | Verifying who is accessing the system                   |
| [authorization](./authorization/)   | Controlling what authenticated actors may do            |
| [event-bus](./event-bus/)           | Publishing and subscribing to domain events             |
| [configuration](./configuration/)   | Environment and tenant-level settings                   |
| [notifications](./notifications/)   | Delivering alerts and messages to actors                |
| [search](./search/)                 | Indexing and querying data across domains               |
| [audit](./audit/)                   | Immutable record of system actions                      |
| [files](./files/)                   | Storage and retrieval of documents and media            |

## Boundaries

Core owns _how the platform runs_. It does not own business entities (business-dna), domain workflows (operations, sales, etc.), or AI agents (ai-workforce).

Business DNA defines _what_ the organization is. Core defines _how_ every domain accesses, communicates, and persists that data safely.
