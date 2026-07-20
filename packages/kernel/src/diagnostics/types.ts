/** @module diagnostics/types */
export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface DiagnosticIssue {
  readonly code: string;
  readonly message: string;
  readonly severity: DiagnosticSeverity;
  readonly remediation?: string;
}

export interface DiagnosticReport {
  readonly healthy: boolean;
  readonly checkedAt: string;
  readonly issues: readonly DiagnosticIssue[];
}
