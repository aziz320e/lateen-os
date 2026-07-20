# Security

## Tenant Isolation

All knowledge jobs and documents are scoped by `organizationId`. The `AccessController` port enforces tenant isolation — cross-tenant access throws.

## Access Control

```typescript
interface AccessController {
  canRead(context, classification, securityLevel): AccessControlResult;
  canWrite(context, classification): AccessControlResult;
  enforceTenantIsolation(organizationId, resourceOrganizationId): void;
}
```

## Classification Levels

| Level | Description |
| ----- | ----------- |
| public | Unrestricted within tenant |
| internal | Default — tenant members |
| confidential | Restricted roles |
| restricted | Elevated permissions required |

## Security Levels

`standard` · `elevated` · `critical`

## PII Detection

`PiiDetector` contract identifies PII entities without implementation. Optional auto-redaction via `RedactionAdapter`.

## Redaction

`RedactionAdapter` contract redacts detected PII before indexing.

## Policy

```typescript
interface SecurityPolicy {
  blockRestrictedWithoutRole: boolean;
  requirePiiScan: boolean;
  autoRedactPii: boolean;
  allowedClassifications: readonly string[];
}
```

## Metadata Security Fields

- `classification` — access classification
- `securityLevel` — sensitivity tier
- `retention` — retention policy reference
