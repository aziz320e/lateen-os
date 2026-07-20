# Audit

The **Audit** capability within Core maintains an immutable record of actions across Lateen OS.

## Responsibility

- Log who did what, when, and to which resource
- Capture changes to Business DNA entities and domain operations
- Provide tamper-evident trails for compliance and investigation
- Support querying audit history with authorization controls

## Boundaries

Audit owns _the record of actions_. It does not own business data or operational workflows. Events from the event bus and direct domain writes feed the audit trail.
