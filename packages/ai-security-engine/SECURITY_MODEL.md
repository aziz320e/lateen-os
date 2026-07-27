# Security Model

> Real, implemented model for the AI Security Engine — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Identity

`identity/service.impl.ts`'s `createIdentityService()` implements all 4 required identity kinds:

- **`createAiIdentity()`** / **`createServiceIdentity()`** — durable principals (an AI agent or a service account), optionally referencing an external id (an AI Runtime `RuntimeAgentId` or a Business DNA `EmployeeId`). No secret material.
- **`createSessionIdentity()`** / **`createApiKeyIdentity()`** — issue a **real**, cryptographically random secret (`generateRandomToken()`, 256 bits by default). Only the secret's SHA-256 hash (`hashValue()`) is ever persisted; the plaintext is returned to the caller exactly once, at issuance.

`revoke()` is terminal. Every identity is tenant-scoped and independently queryable by type or status.

---

## Authentication

`authentication/service.impl.ts`'s `createAuthenticationService()` composes the real Identity service (never a repository) to implement the 3 required validations:

- **`validateToken()`** — hashes the given plaintext and looks up any active, non-expired secret identity by that hash.
- **`validateSession()`** — the same check, restricted to `session_identity`.
- **`validateApiKey()`** — the same check, restricted to `api_key`.

Every failed validation (unknown hash, wrong type, revoked, or expired) is recorded to the shared Audit service and publishes `authentication.failed` with a specific `reason` (`not_found` / `type_mismatch` / `status_revoked` / `expired`).

---

## Authorization

`authorization/service.impl.ts`'s `createAuthorizationService()` implements RBAC, ABAC, and policy-based access as one deterministic engine:

- **RBAC + role inheritance** — `getEffectivePermissions()` walks every role directly assigned to an identity, then each role's `parentRoleId` chain (cycle-safe via a visited set), collecting every permission into a deduplicated, sorted list.
- **ABAC** — a `Policy` with `policyType: 'abac'` carries `attribute` rules (`eq` / `neq` / `in`) evaluated against a caller-supplied attribute map.
- **Policy-based access** — a `Policy` bundles any mix of `role`, `permission`, and `attribute` rules under AND semantics (every rule must match) and an `effect` (`allow` or `deny`).
- **Tenant isolation** — `authorize()`'s first check is always `resourceOrganizationId === organizationId`; a mismatch is denied immediately with reason `tenant_isolation`, before any RBAC/ABAC evaluation runs.

`authorize()`'s full deterministic order: **(1)** tenant isolation, **(2)** any matching active `deny` policy (always wins), **(3)** RBAC permission check, **(4)** any matching active `allow` policy (an ABAC/custom fallback grant). Every denial publishes `authorization.denied` and is recorded to the shared Audit service; every policy mutation (`createPolicy` / `updatePolicy` / `archivePolicy`) publishes `policy.updated`.

---

## Secrets

`secrets/service.impl.ts`'s `createSecretsService()` implements Secret Store, Secret Rotation, Provider Credentials, and Encryption Keys entirely on **real AES-256-GCM** (`shared/crypto.ts`):

- **`generateEncryptionKey()`** — a real random 256-bit key.
- **`createSecret()`** — encrypts the plaintext value under a caller-supplied key; only the ciphertext, IV, and auth tag are persisted (`secretType: 'provider_credential'` covers AI Provider Hub credentials; `'encryption_key'` and `'generic'` cover everything else).
- **`rotateSecret()`** — re-encrypts under a (possibly new) key, incrementing `version` and stamping `rotatedAt`. Publishes `secret.rotated`.
- **`getSecretValue()`** — decrypts with a caller-supplied key. AES-GCM's authentication tag means a wrong key doesn't silently return garbage — it throws, a real, structural guarantee, not application-level validation.

The store never retains an encryption key itself; callers supply it at every read and write, exactly like a real KMS-fronted secret store.

---

## Provider Security

`provider-security/service.impl.ts`'s `createProviderSecurityService()` implements the 3 required restriction types over one deterministic rule, `isAllowed()`: **deny always wins; an empty allow list means "everything not denied is allowed."** This applies uniformly to:

- **Provider Allow List** — `isProviderAllowed()` against `ProviderKind` values.
- **Model Allow List** — `isModelAllowed()` against `ModelId` values.
- **Capability Restrictions** — `isCapabilityAllowed()` against `ProviderCapability` values.

`evaluateProviderRequest()` checks all three in order and publishes `provider.blocked` (with a specific reason) on the first failing check. `isProviderRegisteredInHub()` / `isModelRegisteredInHub()` cross-check the real, injected AI Provider Hub `ProviderRegistry.findByKind()` / `ModelRegistry.get()` — the hub's own exported registry factories, never a repository.

---

## Prompt Security

`prompt-security/service.impl.ts`'s `createPromptSecurityService()` implements:

- **`validatePrompt()`** — pure: rejects empty prompts, prompts over a configurable max length, and prompts containing raw control characters.
- **`sanitizePrompt()`** — pure: strips control characters and collapses excessive whitespace.
- **`signPrompt()`** / **`verifyPromptSignature()`** — **real HMAC-SHA256** (`shared/crypto.ts`), with timing-safe comparison on verification.
- **`auditPrompt()`** — records a `'prompt'`-category entry via the shared Audit service (never a separate, duplicated audit sink).

---

## Tool Security

`tool-security/service.impl.ts`'s `createToolSecurityService()` mirrors Provider Security's deny-wins evaluation over tool ids: **Tool permissions**, **allow list**, **deny list**, and **execution policy** are all expressed as one `ToolPolicy` (`allowedToolIds` / `deniedToolIds`), evaluated by `checkToolExecution()`, which publishes `tool.blocked` on denial. `isToolRegisteredInRuntime()` cross-checks the real, injected AI Runtime `ToolExecutionFramework.listTools()`.

---

## Data Security

`data-security/engine.impl.ts` implements the 5 required capabilities with fixed regex/arithmetic rules — **no AI model**:

- **`detectPii()`** — fixed patterns for `email`, `phone`, `ssn`, and `credit_card`.
- **`classifyData()`** — deterministic priority: `restricted` if SSN/credit-card data is present, `confidential` if email/phone is present, else `internal`.
- **`maskText()`** — every detected match is partially masked, keeping only its last 4 characters.
- **`redactText()`** — every detected match is fully replaced with `[REDACTED]`.
- **Retention Rules** — `createRetentionRule()` ties a `DataClassification` to a `retentionDays` window; `isExpired()` is a pure arithmetic check against an injectable "as of" instant.

---

## Threat Detection

`threat-detection/engine.impl.ts` implements the 5 required detectors, every one deterministic — **no AI model**:

| Threat | Detector | Mechanism |
| ------ | -------- | --------- |
| Prompt Injection | `detectPromptInjection()` | Fixed patterns (`"ignore the previous instructions"`, `"reveal your system prompt"`, etc.) |
| Jailbreak | `detectJailbreak()` | Fixed patterns (`"DAN mode"`, `"bypass your restrictions"`, etc.) |
| Secret Leakage | `detectSecretLeakage()` | Fixed patterns matching API-key- and private-key-shaped strings |
| Tool Abuse | `detectToolAbuse()` | Pure count threshold over a caller-supplied execution-count map |
| Rate Abuse | `detectRateAbuse()` | Pure sliding-window count over caller-supplied timestamps |

`scanPrompt()` runs all 3 text detectors against a single prompt, records a `Threat` for every match, and publishes `prompt.attack.detected` for each — the only detection event in the fixed event list, and a genuinely accurate name since all 3 of `scanPrompt()`'s threat types are prompt-content attacks. `checkToolAbuse()` and `checkRateAbuse()` record `Threat`s too, but (being usage-pattern threats, not prompt-content threats) don't publish that event — they're still fully queryable via `findThreats()`.

---

## Audit

`audit/service.impl.ts`'s `createAuditService()` is the **single** audit sink every other subsystem in this package writes to. `record()` persists one immutable `AuditEvent` (`category`, `action`, `actorId?`, `outcome`, `details?`) and publishes `audit.created`. The three named audit views are filtered projections over the same stream:

- **Security Audit Log** — `findAll()` / `findByCategory()` / `findByActor()`, the full, unfiltered record.
- **Access History** — `findAccessHistory()`, every `'authentication'` or `'authorization'` entry.
- **Policy History** — `findPolicyHistory()`, every `'policy'` entry.
- **Violations** — `findViolations()`, every entry whose `outcome` is not `'success'` (also exposed at the runtime query layer as `findViolations()`).

---

## Relationship Layer — AI Brain, Workflow Engine, Communication Hub, Business DNA

`relationship-management/service.impl.ts` integrates the 4 sibling packages not already covered by Tool Security (AI Runtime) and Provider Security (AI Provider Hub):

| Integration | Method | Public API used |
| ------------ | ------ | ---------------- |
| AI Brain | `getBrainPlanContext()` | `createBrainSystem().queries.explainPlan()` |
| Workflow Engine | `raiseSecurityWorkflowRequest()` | `defineWorkflow()` + `startWorkflow()` (idempotent per organization + request type, cached in-process) |
| Communication Hub | `notifySecurityEvent()` | `notifications.create()` + `notifications.send()` (as an `'escalation'` notification) |
| Business DNA | `getBusinessProfileContext()` | `businessProfile.get()` |

Every method returns `null` when its collaborator wasn't injected at `createSecurityRuntime()` time — never throws, never mocks. The AI Security Engine's own test suite proves each integration is **real** by constructing actual `createBrainSystem()` / `createWorkflowRuntime()` / `createCommunicationRuntime()` / `createBusinessDnaRuntime()` instances (and, for Tool/Provider Security, real `createToolExecutionFramework()` / `createProviderRegistry()` / `createModelRegistry()` instances) and asserting genuine cross-package state — never a mock of any sibling package.

---

## Query Layer

`queries/security-queries.impl.ts`'s `createSecurityQueries()` is the real, read-only query layer exposed by `createSecurityRuntime()` — composed purely over the AI Security Engine repositories, never returning one:

| Method | Returns |
| ------ | ------- |
| `findAuditEvents()` | Audit events filtered by category / outcome / actor |
| `findThreats()` | Detected threats filtered by threat type / severity |
| `findSecrets()` | Secrets (ciphertext + metadata — never plaintext) filtered by secret type / status |
| `findPolicies()` | Authorization policies filtered by policy type / status |
| `findViolations()` | Every audit event whose outcome is not `'success'` |
| `searchSecurity()` | Deterministic keyword search across policies (by name) and secrets (by name), exact match scored above substring match, ranked and tie-broken by id |

---

## Constraints

- No UI, API, LLM, or persistence-adapter implementation in this package — every repository is in-memory and internal to `createSecurityRuntime()`.
- Deterministic and offline: every `create*` factory accepts an injectable `now()`; every function needing randomness (`generateRandomToken`, `generateEncryptionKey`, `encryptValue`) accepts an injectable random-bytes source. Threat/PII detection and search ranking never depend on Map/Set iteration order.
- AI Runtime, AI Provider Hub, AI Brain, Workflow Engine, Communication Hub, and Business DNA are touched **only** through `tool-security` (AI Runtime), `provider-security` (AI Provider Hub), `relationship-management` (AI Brain / Workflow Engine / Communication Hub / Business DNA), and `shared/identifiers.ts` (structural) — never their repositories, never a change to those packages.
- A `Secret`'s stored shape never includes its plaintext value — only ciphertext, IV, and auth tag. Plaintext is returned only from `getSecretValue()`, and only to a caller holding the correct encryption key.
