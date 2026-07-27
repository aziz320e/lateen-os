/**
 * Real Business DNA Engine — a singleton-per-organization market identity:
 * ICPs, personas, buyer journey, positioning, value proposition, tone of
 * voice, brand rules, and competitive advantages.
 *
 * @module dna/engine.impl
 */
import { generateId, nowIso } from '../shared/id.js';
import type { IcpId, OrganizationId, PersonaId } from '../shared/identifiers.js';
import type { BusinessDnaProfileRepository } from './repository.js';
import type {
  BrandRule,
  BrandRuleCategory,
  BuyerJourneyTouchpoint,
  BusinessDnaProfile,
  CompetitiveAdvantage,
  IdealCustomerProfile,
  Persona,
  Positioning,
  ToneOfVoice,
  ValueProposition,
} from './types.js';

export interface AddIcpInput {
  readonly name: string;
  readonly description?: string;
  readonly industries?: readonly string[];
  readonly companySizeRange?: string;
  readonly budgetRange?: string;
  readonly painPoints?: readonly string[];
  readonly goals?: readonly string[];
}

export interface AddPersonaInput {
  readonly name: string;
  readonly role: string;
  readonly goals?: readonly string[];
  readonly painPoints?: readonly string[];
  readonly preferredChannels?: readonly string[];
}

export interface AddBrandRuleInput {
  readonly title: string;
  readonly description: string;
  readonly category: BrandRuleCategory;
}

export interface AddCompetitiveAdvantageInput {
  readonly title: string;
  readonly description?: string;
  readonly proofPoints?: readonly string[];
}

export interface DnaEngine {
  get(organizationId: OrganizationId): Promise<BusinessDnaProfile | null>;
  addIcp(organizationId: OrganizationId, input: AddIcpInput): Promise<BusinessDnaProfile>;
  removeIcp(organizationId: OrganizationId, icpId: IcpId): Promise<BusinessDnaProfile>;
  addPersona(organizationId: OrganizationId, input: AddPersonaInput): Promise<BusinessDnaProfile>;
  removePersona(organizationId: OrganizationId, personaId: PersonaId): Promise<BusinessDnaProfile>;
  addBuyerJourneyTouchpoint(organizationId: OrganizationId, touchpoint: BuyerJourneyTouchpoint): Promise<BusinessDnaProfile>;
  setPositioning(organizationId: OrganizationId, positioning: Positioning): Promise<BusinessDnaProfile>;
  setValueProposition(organizationId: OrganizationId, valueProposition: ValueProposition): Promise<BusinessDnaProfile>;
  setToneOfVoice(organizationId: OrganizationId, toneOfVoice: ToneOfVoice): Promise<BusinessDnaProfile>;
  addBrandRule(organizationId: OrganizationId, input: AddBrandRuleInput): Promise<BusinessDnaProfile>;
  addCompetitiveAdvantage(organizationId: OrganizationId, input: AddCompetitiveAdvantageInput): Promise<BusinessDnaProfile>;
}

/** Creates a real {@link DnaEngine} backed by a {@link BusinessDnaProfileRepository}. */
export function createDnaEngine(repository: BusinessDnaProfileRepository, now: () => string = nowIso): DnaEngine {
  async function getOrCreate(organizationId: OrganizationId): Promise<BusinessDnaProfile> {
    const existing = await repository.findByOrganization(organizationId);
    if (existing) return existing;
    const timestamp = now();
    const created: BusinessDnaProfile = {
      id: organizationId,
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      icps: [],
      personas: [],
      buyerJourney: [],
      brandRules: [],
      competitiveAdvantages: [],
    };
    await repository.save(created);
    return created;
  }

  async function persist(organizationId: OrganizationId, patch: Partial<BusinessDnaProfile>): Promise<BusinessDnaProfile> {
    const current = await getOrCreate(organizationId);
    const updated: BusinessDnaProfile = { ...current, ...patch, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async get(organizationId) {
      return repository.findByOrganization(organizationId);
    },

    async addIcp(organizationId, input) {
      const current = await getOrCreate(organizationId);
      const icp: IdealCustomerProfile = {
        icpId: generateId('icp'),
        name: input.name,
        description: input.description,
        industries: input.industries,
        companySizeRange: input.companySizeRange,
        budgetRange: input.budgetRange,
        painPoints: input.painPoints ?? [],
        goals: input.goals ?? [],
      };
      return persist(organizationId, { icps: [...current.icps, icp] });
    },

    async removeIcp(organizationId, icpId) {
      const current = await getOrCreate(organizationId);
      return persist(organizationId, { icps: current.icps.filter((icp) => icp.icpId !== icpId) });
    },

    async addPersona(organizationId, input) {
      const current = await getOrCreate(organizationId);
      const persona: Persona = {
        personaId: generateId('persona'),
        name: input.name,
        role: input.role,
        goals: input.goals ?? [],
        painPoints: input.painPoints ?? [],
        preferredChannels: input.preferredChannels,
      };
      return persist(organizationId, { personas: [...current.personas, persona] });
    },

    async removePersona(organizationId, personaId) {
      const current = await getOrCreate(organizationId);
      return persist(organizationId, { personas: current.personas.filter((persona) => persona.personaId !== personaId) });
    },

    async addBuyerJourneyTouchpoint(organizationId, touchpoint) {
      const current = await getOrCreate(organizationId);
      return persist(organizationId, { buyerJourney: [...current.buyerJourney, touchpoint] });
    },

    async setPositioning(organizationId, positioning) {
      return persist(organizationId, { positioning });
    },

    async setValueProposition(organizationId, valueProposition) {
      return persist(organizationId, { valueProposition });
    },

    async setToneOfVoice(organizationId, toneOfVoice) {
      return persist(organizationId, { toneOfVoice });
    },

    async addBrandRule(organizationId, input) {
      const current = await getOrCreate(organizationId);
      const rule: BrandRule = { ruleId: generateId('brand-rule'), title: input.title, description: input.description, category: input.category };
      return persist(organizationId, { brandRules: [...current.brandRules, rule] });
    },

    async addCompetitiveAdvantage(organizationId, input) {
      const current = await getOrCreate(organizationId);
      const advantage: CompetitiveAdvantage = {
        advantageId: generateId('advantage'),
        title: input.title,
        description: input.description,
        proofPoints: input.proofPoints,
      };
      return persist(organizationId, { competitiveAdvantages: [...current.competitiveAdvantages, advantage] });
    },
  };
}
