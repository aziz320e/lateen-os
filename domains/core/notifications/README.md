# Notifications

The **Notifications** capability within Core delivers messages and alerts to actors across Lateen OS.

## Responsibility

- Route notifications through channels (in-app, email, SMS, push, etc.)
- Manage templates, preferences, and delivery scheduling
- React to domain events and system triggers
- Track delivery status and actor engagement

## Boundaries

Notifications own _message delivery_. The content and business rules that trigger notifications belong to the originating domain. Business DNA may define notification policies; notifications execute them.
