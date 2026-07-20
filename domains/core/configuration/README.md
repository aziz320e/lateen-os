# Configuration

The **Configuration** capability within Core manages runtime settings for the platform and tenants.

## Responsibility

- Store and serve environment, tenant, and feature-level configuration
- Support scoped overrides (global, organization, branch, user)
- Version and audit configuration changes
- Provide a single source for non-business settings (Business DNA owns business rules)

## Boundaries

Configuration owns _platform and operational settings_. Business policies, workflows, and organizational structure live in Business DNA. Secrets and credentials are managed separately from public configuration.
