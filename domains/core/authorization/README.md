# Authorization

The **Authorization** capability within Core controls what authenticated actors are permitted to do.

## Responsibility

- Evaluate permissions against Business DNA policy and role definitions
- Enforce access control at domain, resource, and action granularity
- Support role-based and attribute-based access models
- Provide a single authorization decision point for all domains and AI agents

## Boundaries

Authorization owns _access decisions_. Permissions and policies are defined in Business DNA; authorization evaluates them at runtime. Authentication establishes identity; authorization uses it.
