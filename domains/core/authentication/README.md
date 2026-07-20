# Authentication

The **Authentication** capability within Core verifies that actors are who they claim to be.

## Responsibility

- Manage login flows, sessions, tokens, and credential validation
- Support multiple authentication methods (password, SSO, API keys, etc.)
- Enforce session policies: expiry, rotation, and revocation
- Integrate with identity records to resolve authenticated actors

## Boundaries

Authentication owns _proving identity_. Authorization decides what that identity may access. Business DNA defines employee and agent records; authentication binds credentials to those records.
