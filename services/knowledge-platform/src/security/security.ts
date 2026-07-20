export interface AccessControlContext {
  readonly organizationId: string;
  readonly userId?: string;
  readonly roles: readonly string[];
  readonly department?: string;
}

export interface AccessControlResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

/** Tenant-isolated access control port. */
export interface AccessController {
  canRead(context: AccessControlContext, classification: string, securityLevel: string): AccessControlResult;
  canWrite(context: AccessControlContext, classification: string): AccessControlResult;
  enforceTenantIsolation(organizationId: string, resourceOrganizationId: string): void;
}

export interface PiiDetectionResult {
  readonly detected: boolean;
  readonly entities: readonly { readonly type: string; readonly value: string; readonly start: number; readonly end: number }[];
}

/** PII detection contract — no implementation. */
export interface PiiDetector {
  detect(text: string): Promise<PiiDetectionResult>;
}

export interface RedactionResult {
  readonly redactedText: string;
  readonly redactedCount: number;
}

/** Redaction contract — no implementation. */
export interface RedactionAdapter {
  redact(text: string, pii: PiiDetectionResult): Promise<RedactionResult>;
}

export interface SecurityPolicy {
  readonly blockRestrictedWithoutRole: boolean;
  readonly requirePiiScan: boolean;
  readonly autoRedactPii: boolean;
  readonly allowedClassifications: readonly string[];
}
