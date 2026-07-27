/** @module data-security/types */
import type { RetentionRuleId } from '../shared/identifiers.js';

export type { RetentionRuleId };

export type PiiType = 'email' | 'phone' | 'ssn' | 'credit_card';

export interface PiiMatch {
  readonly piiType: PiiType;
  readonly value: string;
}

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

/** How long data of a given classification may be retained before it is considered expired. */
export interface RetentionRule {
  readonly id: RetentionRuleId;
  readonly organizationId: string;
  readonly dataClassification: DataClassification;
  readonly retentionDays: number;
  readonly createdAt: string;
}
