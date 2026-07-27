import { describe, expect, it } from 'vitest';
import { createBusinessDnaProfileRepository } from '../src/dna/repository.impl.js';
import { createDnaEngine } from '../src/dna/engine.impl.js';

const ORG = 'org-1';

describe('createDnaEngine', () => {
  it('addIcp() and removeIcp() manage the ICP collection', async () => {
    const engine = createDnaEngine(createBusinessDnaProfileRepository());
    const added = await engine.addIcp(ORG, { name: 'Mid-market retailers', painPoints: ['slow turnaround'], goals: ['brand consistency'] });
    expect(added.icps).toHaveLength(1);
    const icpId = added.icps[0]!.icpId;

    const removed = await engine.removeIcp(ORG, icpId);
    expect(removed.icps).toHaveLength(0);
  });

  it('addPersona() and removePersona() manage the persona collection', async () => {
    const engine = createDnaEngine(createBusinessDnaProfileRepository());
    const added = await engine.addPersona(ORG, { name: 'Marketing Director', role: 'decision maker' });
    expect(added.personas).toHaveLength(1);
    const personaId = added.personas[0]!.personaId;

    const removed = await engine.removePersona(ORG, personaId);
    expect(removed.personas).toHaveLength(0);
  });

  it('addBuyerJourneyTouchpoint() appends to the buyer journey', async () => {
    const engine = createDnaEngine(createBusinessDnaProfileRepository());
    const result = await engine.addBuyerJourneyTouchpoint(ORG, { stage: 'awareness', description: 'Sees an ad', channel: 'social' });
    expect(result.buyerJourney).toHaveLength(1);
    expect(result.buyerJourney[0]?.stage).toBe('awareness');
  });

  it('setPositioning(), setValueProposition(), setToneOfVoice() set singleton facets', async () => {
    const engine = createDnaEngine(createBusinessDnaProfileRepository());
    const positioned = await engine.setPositioning(ORG, {
      statement: 'The fastest signage partner in the Gulf',
      targetSegment: 'mid-market retail',
      differentiators: ['speed', 'quality'],
    });
    expect(positioned.positioning?.statement).toContain('fastest');

    const valued = await engine.setValueProposition(ORG, { headline: 'Signage in 48 hours', supportingPoints: ['AI-first production'] });
    expect(valued.valueProposition?.headline).toBe('Signage in 48 hours');

    const toned = await engine.setToneOfVoice(ORG, { attributes: ['friendly', 'authoritative'] });
    expect(toned.toneOfVoice?.attributes).toEqual(['friendly', 'authoritative']);
  });

  it('addBrandRule() and addCompetitiveAdvantage() append entries', async () => {
    const engine = createDnaEngine(createBusinessDnaProfileRepository());
    const withRule = await engine.addBrandRule(ORG, { title: 'Logo clear space', description: 'Minimum 1x logo height', category: 'visual' });
    expect(withRule.brandRules).toHaveLength(1);

    const withAdvantage = await engine.addCompetitiveAdvantage(ORG, { title: 'In-house fabrication', proofPoints: ['24h lead time'] });
    expect(withAdvantage.competitiveAdvantages).toHaveLength(1);
  });

  it('accumulates facets across independent calls (singleton getOrCreate)', async () => {
    const engine = createDnaEngine(createBusinessDnaProfileRepository());
    await engine.addIcp(ORG, { name: 'ICP 1' });
    await engine.addPersona(ORG, { name: 'Persona 1', role: 'buyer' });
    const profile = await engine.get(ORG);
    expect(profile?.icps).toHaveLength(1);
    expect(profile?.personas).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const engine = createDnaEngine(createBusinessDnaProfileRepository());
    await engine.addIcp(ORG, { name: 'ICP 1' });
    expect(await engine.get('org-2')).toBeNull();
  });
});
