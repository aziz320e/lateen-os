/**
 * Business DNA Engine — singleton-per-organization ICPs, personas, buyer
 * journey, positioning, value proposition, tone of voice, brand rules, and
 * competitive advantages.
 * @module dna
 */
export * from './types.js';
export * from './repository.js';
export { createBusinessDnaProfileRepository } from './repository.impl.js';
export {
  createDnaEngine,
  type DnaEngine,
  type AddIcpInput,
  type AddPersonaInput,
  type AddBrandRuleInput,
  type AddCompetitiveAdvantageInput,
} from './engine.impl.js';
