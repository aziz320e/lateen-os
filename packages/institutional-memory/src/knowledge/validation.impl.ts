/**
 * Real Knowledge Validation — duplicate detection, stale-knowledge
 * detection, ownership validation, and expiration checks. Pure,
 * deterministic string/date comparisons: no AI/LLM involved.
 *
 * @module knowledge/validation.impl
 */
import { guardFail, guardPass, type Result, type DomainError } from '@lateen-os/shared-kernel/core';
import { nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { KnowledgeEntryRepository } from './repository.js';
import type { KnowledgeEntry } from './types.js';

export type DuplicateReason = 'exact_title' | 'similar_content';

export interface DuplicateCandidate {
  readonly entry: KnowledgeEntry;
  readonly similarity: number;
  readonly reason: DuplicateReason;
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 0),
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000;
}

export interface KnowledgeValidationEngine {
  detectDuplicates(organizationId: OrganizationId, candidateTitle: string, candidateContent?: string): Promise<readonly DuplicateCandidate[]>;
  detectStale(organizationId: OrganizationId, staleAfterDays?: number, at?: string): Promise<readonly KnowledgeEntry[]>;
  /** Pure ownership check — 'private'/'restricted' entries must carry an ownerId. */
  validateOwnership(entry: KnowledgeEntry): Result<void, DomainError>;
  checkExpiration(organizationId: OrganizationId, at?: string): Promise<readonly KnowledgeEntry[]>;
}

const CONTENT_SIMILARITY_THRESHOLD = 0.8;

/** Creates a real {@link KnowledgeValidationEngine} over a {@link KnowledgeEntryRepository}. */
export function createKnowledgeValidationEngine(repository: KnowledgeEntryRepository, now: () => string = nowIso): KnowledgeValidationEngine {
  return {
    async detectDuplicates(organizationId, candidateTitle, candidateContent) {
      const all = await repository.findByOrganization(organizationId);
      const normalizedCandidate = normalizeTitle(candidateTitle);
      const candidateTokens = candidateContent ? tokenSet(candidateContent) : undefined;

      const candidates: DuplicateCandidate[] = [];
      for (const entry of all) {
        if (normalizeTitle(entry.title) === normalizedCandidate) {
          candidates.push({ entry, similarity: 1, reason: 'exact_title' });
          continue;
        }
        if (candidateTokens) {
          const similarity = jaccardSimilarity(candidateTokens, tokenSet(entry.content));
          if (similarity >= CONTENT_SIMILARITY_THRESHOLD) {
            candidates.push({ entry, similarity, reason: 'similar_content' });
          }
        }
      }
      return candidates.sort((a, b) => b.similarity - a.similarity);
    },

    async detectStale(organizationId, staleAfterDays = 180, at = now()) {
      const all = await repository.findByStatus(organizationId, 'published');
      return all.filter((entry) => daysBetween(entry.updatedAt, at) >= staleAfterDays);
    },

    validateOwnership(entry) {
      if ((entry.visibility === 'private' || entry.visibility === 'restricted') && !entry.ownerId) {
        return guardFail(
          'institutional_memory.knowledge.missing_owner',
          `Knowledge entry "${entry.id}" has "${entry.visibility}" visibility but no ownerId`,
        );
      }
      return guardPass();
    },

    async checkExpiration(organizationId, at = now()) {
      const all = await repository.findByOrganization(organizationId);
      return all.filter((entry) => entry.expiresAt !== undefined && entry.expiresAt <= at && entry.status !== 'archived');
    },
  };
}
