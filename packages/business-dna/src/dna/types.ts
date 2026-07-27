/** @module dna/types */
import type { Entity } from '../shared/entity.js';
import type {
  BrandRuleId,
  BusinessDnaProfileId,
  CompetitiveAdvantageId,
  IcpId,
  OrganizationId,
  PersonaId,
} from '../shared/identifiers.js';
import type { Auditable, TenantScoped } from '../shared/primitives.js';

export type { BusinessDnaProfileId, IcpId, PersonaId, BrandRuleId, CompetitiveAdvantageId };

/** Ideal Customer Profile — the firmographic and behavioral shape of a best-fit customer. */
export interface IdealCustomerProfile {
  readonly icpId: IcpId;
  readonly name: string;
  readonly description?: string;
  readonly industries?: readonly string[];
  readonly companySizeRange?: string;
  readonly budgetRange?: string;
  readonly painPoints: readonly string[];
  readonly goals: readonly string[];
}

/** A buyer persona representing an individual decision-maker or influencer. */
export interface Persona {
  readonly personaId: PersonaId;
  readonly name: string;
  readonly role: string;
  readonly goals: readonly string[];
  readonly painPoints: readonly string[];
  readonly preferredChannels?: readonly string[];
}

export type BuyerJourneyStage = 'awareness' | 'consideration' | 'decision' | 'retention' | 'advocacy';

/** A touchpoint the buyer encounters at a given journey stage. */
export interface BuyerJourneyTouchpoint {
  readonly stage: BuyerJourneyStage;
  readonly description: string;
  readonly channel?: string;
}

/** Market positioning statement. */
export interface Positioning {
  readonly statement: string;
  readonly targetSegment: string;
  readonly differentiators: readonly string[];
}

/** Core value proposition communicated to the market. */
export interface ValueProposition {
  readonly headline: string;
  readonly supportingPoints: readonly string[];
}

export type ToneAttribute = 'formal' | 'casual' | 'friendly' | 'authoritative' | 'playful' | 'technical';

/** Brand tone of voice guidelines. */
export interface ToneOfVoice {
  readonly attributes: readonly ToneAttribute[];
  readonly guidelines?: string;
  readonly examplePhrases?: readonly string[];
}

export type BrandRuleCategory = 'visual' | 'verbal' | 'legal' | 'other';

/** A single brand compliance rule. */
export interface BrandRule {
  readonly ruleId: BrandRuleId;
  readonly title: string;
  readonly description: string;
  readonly category: BrandRuleCategory;
}

/** A durable competitive advantage with supporting proof points. */
export interface CompetitiveAdvantage {
  readonly advantageId: CompetitiveAdvantageId;
  readonly title: string;
  readonly description?: string;
  readonly proofPoints?: readonly string[];
}

/**
 * Business DNA Profile — a singleton per organization holding the
 * organization's market identity: ICPs, personas, buyer journey,
 * positioning, value proposition, tone of voice, brand rules, and
 * competitive advantages.
 */
export interface BusinessDnaProfile extends Entity<BusinessDnaProfileId>, TenantScoped, Auditable {
  readonly icps: readonly IdealCustomerProfile[];
  readonly personas: readonly Persona[];
  readonly buyerJourney: readonly BuyerJourneyTouchpoint[];
  readonly positioning?: Positioning;
  readonly valueProposition?: ValueProposition;
  readonly toneOfVoice?: ToneOfVoice;
  readonly brandRules: readonly BrandRule[];
  readonly competitiveAdvantages: readonly CompetitiveAdvantage[];
}

export type { OrganizationId };
