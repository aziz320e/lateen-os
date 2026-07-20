# Event Bus

The **Event Bus** capability within Core enables asynchronous communication between domains.

## Responsibility

- Publish and deliver domain events across Lateen OS
- Maintain event schemas, routing, and subscription contracts
- Guarantee delivery semantics (at-least-once, ordering where required)
- Decouple producers from consumers so domains evolve independently

## Boundaries

The event bus owns _how domains communicate_. Each domain owns the business meaning of its events. Audit may consume events for logging; notifications may react to events for delivery.
