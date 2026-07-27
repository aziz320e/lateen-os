/**
 * Real Data Security engine — deterministic PII Detection, Data
 * Classification, Masking, Redaction, and Retention Rules. Every
 * detector is a fixed regex; every classification and retention check
 * is fixed arithmetic. No AI/LLM.
 *
 * @module data-security/engine.impl
 */
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, RetentionRuleId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { RetentionRuleRepository } from './repository.js';
import type { DataClassification, PiiMatch, PiiType, RetentionRule } from './types.js';

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_PATTERN = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_CARD_PATTERN = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;

const PII_PATTERNS: ReadonlyArray<readonly [PiiType, RegExp]> = [
  ['ssn', SSN_PATTERN],
  ['credit_card', CREDIT_CARD_PATTERN],
  ['email', EMAIL_PATTERN],
  ['phone', PHONE_PATTERN],
];

/** Pure: every PII match found in `text`, in fixed detector priority order (ssn, credit_card, email, phone). */
export function detectPii(text: string): readonly PiiMatch[] {
  const matches: PiiMatch[] = [];
  for (const [piiType, pattern] of PII_PATTERNS) {
    for (const match of text.matchAll(new RegExp(pattern.source, pattern.flags))) {
      matches.push({ piiType, value: match[0] });
    }
  }
  return matches;
}

/** Pure: `restricted` if SSN/credit-card data is present, `confidential` if email/phone is present, else `internal`. */
export function classifyData(text: string): DataClassification {
  const matches = detectPii(text);
  if (matches.some((match) => match.piiType === 'ssn' || match.piiType === 'credit_card')) return 'restricted';
  if (matches.some((match) => match.piiType === 'email' || match.piiType === 'phone')) return 'confidential';
  return 'internal';
}

function maskMatch(value: string): string {
  const visible = 4;
  if (value.length <= visible) return '*'.repeat(value.length);
  return '*'.repeat(value.length - visible) + value.slice(-visible);
}

/** Pure: every detected PII match is partially masked, keeping only its last 4 characters. */
export function maskText(text: string): string {
  let masked = text;
  for (const [, pattern] of PII_PATTERNS) {
    masked = masked.replace(new RegExp(pattern.source, pattern.flags), (match) => maskMatch(match));
  }
  return masked;
}

/** Pure: every detected PII match is fully replaced with `[REDACTED]`. */
export function redactText(text: string): string {
  let redacted = text;
  for (const [, pattern] of PII_PATTERNS) {
    redacted = redacted.replace(new RegExp(pattern.source, pattern.flags), '[REDACTED]');
  }
  return redacted;
}

/** Pure: `true` when `createdAt` is older than `rule.retentionDays`, as of `asOf`. */
export function isRetentionExpired(rule: Pick<RetentionRule, 'retentionDays'>, createdAt: ISODateTime, asOf: ISODateTime): boolean {
  const ageMs = new Date(asOf).getTime() - new Date(createdAt).getTime();
  return ageMs > rule.retentionDays * 24 * 60 * 60 * 1000;
}

export interface CreateRetentionRuleInput {
  readonly dataClassification: DataClassification;
  readonly retentionDays: number;
}

export interface DataSecurityService {
  detectPii(text: string): readonly PiiMatch[];
  classifyData(text: string): DataClassification;
  maskText(text: string): string;
  redactText(text: string): string;
  createRetentionRule(organizationId: OrganizationId, input: CreateRetentionRuleInput): Promise<RetentionRule>;
  getRetentionRule(organizationId: OrganizationId, ruleId: RetentionRuleId): Promise<RetentionRule | null>;
  getRetentionRuleForClassification(organizationId: OrganizationId, dataClassification: DataClassification): Promise<RetentionRule | null>;
  isExpired(rule: Pick<RetentionRule, 'retentionDays'>, createdAt: ISODateTime, asOf?: ISODateTime): boolean;
}

/** Creates a real {@link DataSecurityService} backed by a {@link RetentionRuleRepository}. */
export function createDataSecurityService(repository: RetentionRuleRepository, now: () => string = nowIso): DataSecurityService {
  return {
    detectPii,
    classifyData,
    maskText,
    redactText,

    async createRetentionRule(organizationId, input) {
      const rule: RetentionRule = {
        id: generateId('retention-rule'),
        organizationId,
        dataClassification: input.dataClassification,
        retentionDays: input.retentionDays,
        createdAt: now(),
      };
      await repository.save(rule);
      return rule;
    },

    async getRetentionRule(organizationId, ruleId) {
      return repository.findById(organizationId, ruleId);
    },

    async getRetentionRuleForClassification(organizationId, dataClassification) {
      return repository.findByClassification(organizationId, dataClassification);
    },

    isExpired(rule, createdAt, asOf) {
      return isRetentionExpired(rule, createdAt, asOf ?? now());
    },
  };
}
