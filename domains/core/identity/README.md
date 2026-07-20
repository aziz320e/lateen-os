# Identity

The **Identity** capability within Core manages the canonical representation of actors and entities across Lateen OS.

## Responsibility

- Maintain a unified registry of users, service accounts, and system actors
- Link identities to records in Business DNA (employees, customers, AI agents, etc.)
- Provide stable identifiers that persist across domains and integrations
- Govern identity lifecycle: creation, assignment, deactivation, and archival

## Boundaries

Identity owns _who exists in the system_. Authentication verifies credentials; authorization enforces permissions. Business DNA owns the business meaning of each entity.
