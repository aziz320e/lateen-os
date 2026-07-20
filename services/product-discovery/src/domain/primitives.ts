/** @module domain/primitives */
import type { AuditInfo } from '@lateen-os/shared-kernel/audit';

export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Decimal score string (0–1 or domain-specific scale). */
export type ScoreValue = string;

/** ISO 4217 currency code. */
export type CurrencyCode = string;
