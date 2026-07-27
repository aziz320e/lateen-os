/**
 * Real Duplicate Detection — deterministic matching by email, phone,
 * company, and normalized name. Pure string comparisons: no fuzzy
 * matching library, no AI/LLM.
 *
 * @module duplicate-detection/engine.impl
 */
import type { CustomerRepository } from '../customer/repository.js';
import type { Customer } from '../customer/types.js';
import type { LeadRepository } from '../lead/repository.js';
import type { Lead } from '../lead/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { DuplicateCandidateInput, DuplicateMatch, DuplicateMatchField } from './types.js';

const FIELD_WEIGHTS: Readonly<Record<DuplicateMatchField, number>> = {
  email: 0.5,
  phone: 0.3,
  company: 0.1,
  name: 0.1,
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D+/g, '');
}

export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Pure, deterministic duplicate matcher — generic over any record shape carrying email/phone/company/name. */
export function detectDuplicates<T extends DuplicateCandidateInput>(
  existing: readonly T[],
  candidate: DuplicateCandidateInput,
): readonly DuplicateMatch<T>[] {
  const candidateEmail = candidate.email ? normalizeEmail(candidate.email) : undefined;
  const candidatePhone = candidate.phone ? normalizePhone(candidate.phone) : undefined;
  const candidateCompany = candidate.company ? normalizeText(candidate.company) : undefined;
  const candidateName = candidate.name ? normalizeText(candidate.name) : undefined;

  const matches: DuplicateMatch<T>[] = [];
  for (const record of existing) {
    const matchedOn: DuplicateMatchField[] = [];
    if (candidateEmail && record.email && normalizeEmail(record.email) === candidateEmail) matchedOn.push('email');
    if (candidatePhone && record.phone && normalizePhone(record.phone) === candidatePhone) matchedOn.push('phone');
    if (candidateCompany && record.company && normalizeText(record.company) === candidateCompany) matchedOn.push('company');
    if (candidateName && record.name && normalizeText(record.name) === candidateName) matchedOn.push('name');

    if (matchedOn.length === 0) continue;
    const score = matchedOn.reduce((sum, field) => sum + FIELD_WEIGHTS[field], 0);
    matches.push({ record, matchedOn, score });
  }

  return matches.sort((a, b) => b.score - a.score);
}

export interface CrmDuplicateDetectionEngine {
  detectCustomerDuplicates(organizationId: OrganizationId, candidate: DuplicateCandidateInput): Promise<readonly DuplicateMatch<Customer>[]>;
  detectLeadDuplicates(organizationId: OrganizationId, candidate: DuplicateCandidateInput): Promise<readonly DuplicateMatch<Lead>[]>;
}

/** Creates a real {@link CrmDuplicateDetectionEngine} over the Customer and Lead repositories. */
export function createCrmDuplicateDetectionEngine(
  customerRepository: CustomerRepository,
  leadRepository: LeadRepository,
): CrmDuplicateDetectionEngine {
  return {
    async detectCustomerDuplicates(organizationId, candidate) {
      const customers = await customerRepository.findAll(organizationId);
      return detectDuplicates(
        customers.filter((customer) => customer.status !== 'merged'),
        candidate,
      );
    },

    async detectLeadDuplicates(organizationId, candidate) {
      const leads = await leadRepository.findAll(organizationId);
      return detectDuplicates(leads, candidate);
    },
  };
}
