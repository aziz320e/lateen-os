/**
 * Real Competitor Registry — add/update/archive plus deterministic
 * comparison and ranking helpers. No AI/LLM involved anywhere.
 *
 * @module competitor/registry.impl
 */
import type { BusinessDnaEventBus } from '../events/business-dna-event-bus.js';
import { CompetitorNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CompetitorId, OrganizationId } from '../shared/identifiers.js';
import type { CompetitorRepository } from './repository.js';
import type { Competitor } from './types.js';

export interface AddCompetitorInput {
  readonly name: string;
  readonly website?: string;
  readonly strengths?: readonly string[];
  readonly weaknesses?: readonly string[];
  readonly priceIndex?: string;
  readonly marketShareEstimatePct?: string;
  readonly notes?: string;
}

export interface UpdateCompetitorInput {
  readonly website?: string;
  readonly strengths?: readonly string[];
  readonly weaknesses?: readonly string[];
  readonly priceIndex?: string;
  readonly marketShareEstimatePct?: string;
  readonly notes?: string;
}

export type PricePosition = 'cheaper' | 'similar' | 'pricier';

export interface CompetitorComparison {
  readonly sharedStrengths: readonly string[];
  readonly strengthsOnlyInA: readonly string[];
  readonly strengthsOnlyInB: readonly string[];
  readonly sharedWeaknesses: readonly string[];
  readonly weaknessesOnlyInA: readonly string[];
  readonly weaknessesOnlyInB: readonly string[];
  /** competitorA's price position relative to competitorB, when both report a priceIndex. */
  readonly relativePricePosition?: PricePosition;
}

function diffSets(a: readonly string[], b: readonly string[]) {
  const setA = new Set(a);
  const setB = new Set(b);
  return {
    shared: a.filter((value) => setB.has(value)).sort(),
    onlyInA: a.filter((value) => !setB.has(value)).sort(),
    onlyInB: b.filter((value) => !setA.has(value)).sort(),
  };
}

function pricePosition(indexA: number, indexB: number): PricePosition {
  const delta = (indexA - indexB) / indexB;
  if (delta < -0.05) return 'cheaper';
  if (delta > 0.05) return 'pricier';
  return 'similar';
}

export interface CompetitorRegistry {
  add(organizationId: OrganizationId, input: AddCompetitorInput): Promise<Competitor>;
  update(organizationId: OrganizationId, competitorId: CompetitorId, patch: UpdateCompetitorInput): Promise<Competitor>;
  archive(organizationId: OrganizationId, competitorId: CompetitorId): Promise<Competitor>;
  get(organizationId: OrganizationId, competitorId: CompetitorId): Promise<Competitor | null>;
  list(organizationId: OrganizationId): Promise<readonly Competitor[]>;
  /** Deterministic strengths/weaknesses/price diff between two competitors. */
  compare(competitorA: Competitor, competitorB: Competitor): CompetitorComparison;
  /** Deterministic price comparison against our own price index (default "1.00"). */
  compareToOwnPricing(competitor: Competitor, ourPriceIndex?: string): PricePosition | undefined;
  /** Active competitors ranked by estimated market share (desc), tie-broken by name (asc). */
  rankByMarketShare(organizationId: OrganizationId): Promise<readonly Competitor[]>;
}

/** Creates a real {@link CompetitorRegistry} backed by a {@link CompetitorRepository}. */
export function createCompetitorRegistry(
  repository: CompetitorRepository,
  eventBus?: BusinessDnaEventBus,
  now: () => string = nowIso,
): CompetitorRegistry {
  async function requireCompetitor(organizationId: OrganizationId, competitorId: CompetitorId): Promise<Competitor> {
    const competitor = await repository.findById(organizationId, competitorId);
    if (!competitor) throw new CompetitorNotFoundError(competitorId);
    return competitor;
  }

  return {
    async add(organizationId, input) {
      const timestamp = now();
      const competitor: Competitor = {
        id: generateId('competitor'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        website: input.website,
        status: 'active',
        strengths: input.strengths ?? [],
        weaknesses: input.weaknesses ?? [],
        priceIndex: input.priceIndex,
        marketShareEstimatePct: input.marketShareEstimatePct,
        notes: input.notes,
      };
      await repository.save(competitor);
      eventBus?.publish('competitor.registered', { competitorId: competitor.id, organizationId, name: competitor.name });
      return competitor;
    },

    async update(organizationId, competitorId, patch) {
      const competitor = await requireCompetitor(organizationId, competitorId);
      const updated: Competitor = { ...competitor, ...patch, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async archive(organizationId, competitorId) {
      const competitor = await requireCompetitor(organizationId, competitorId);
      const updated: Competitor = { ...competitor, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, competitorId) {
      return repository.findById(organizationId, competitorId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    compare(competitorA, competitorB) {
      const strengths = diffSets(competitorA.strengths, competitorB.strengths);
      const weaknesses = diffSets(competitorA.weaknesses, competitorB.weaknesses);
      const indexA = competitorA.priceIndex ? Number.parseFloat(competitorA.priceIndex) : undefined;
      const indexB = competitorB.priceIndex ? Number.parseFloat(competitorB.priceIndex) : undefined;
      return {
        sharedStrengths: strengths.shared,
        strengthsOnlyInA: strengths.onlyInA,
        strengthsOnlyInB: strengths.onlyInB,
        sharedWeaknesses: weaknesses.shared,
        weaknessesOnlyInA: weaknesses.onlyInA,
        weaknessesOnlyInB: weaknesses.onlyInB,
        relativePricePosition: indexA !== undefined && indexB !== undefined ? pricePosition(indexA, indexB) : undefined,
      };
    },

    compareToOwnPricing(competitor, ourPriceIndex = '1.00') {
      if (!competitor.priceIndex) return undefined;
      return pricePosition(Number.parseFloat(competitor.priceIndex), Number.parseFloat(ourPriceIndex));
    },

    async rankByMarketShare(organizationId) {
      const active = await repository.findByStatus(organizationId, 'active');
      return [...active].sort((a, b) => {
        const shareA = a.marketShareEstimatePct ? Number.parseFloat(a.marketShareEstimatePct) : -1;
        const shareB = b.marketShareEstimatePct ? Number.parseFloat(b.marketShareEstimatePct) : -1;
        if (shareB !== shareA) return shareB - shareA;
        return a.name.localeCompare(b.name);
      });
    },
  };
}
