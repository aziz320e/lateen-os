import { describe, expect, it } from 'vitest';
import { createGovernanceRuleRepository } from '../src/rules-engine/repository.impl.js';
import { createGovernanceRulesEngine, matchesConditions } from '../src/rules-engine/engine.impl.js';
import { createGovernanceEventBus } from '../src/events/index.js';
import { GovernanceRuleNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createGovernanceEventBus()) {
  const repository = createGovernanceRuleRepository();
  const engine = createGovernanceRulesEngine(repository, eventBus);
  return { repository, engine, eventBus };
}

describe('matchesConditions (pure)', () => {
  it('matches with eq operator', () => {
    expect(matchesConditions({ region: 'eu' }, [{ attribute: 'region', operator: 'eq', value: 'eu' }])).toBe(true);
  });

  it('matches with neq operator', () => {
    expect(matchesConditions({ region: 'eu' }, [{ attribute: 'region', operator: 'neq', value: 'us' }])).toBe(true);
  });

  it('neq operator returns false when the values are equal', () => {
    expect(matchesConditions({ region: 'eu' }, [{ attribute: 'region', operator: 'neq', value: 'eu' }])).toBe(false);
  });

  it('matches with in operator', () => {
    expect(matchesConditions({ region: 'eu' }, [{ attribute: 'region', operator: 'in', value: ['eu', 'uk'] }])).toBe(true);
    expect(matchesConditions({ region: 'us' }, [{ attribute: 'region', operator: 'in', value: ['eu', 'uk'] }])).toBe(false);
  });

  it('requires every condition to match (AND semantics)', () => {
    const conditions = [
      { attribute: 'region', operator: 'eq' as const, value: 'eu' },
      { attribute: 'tier', operator: 'eq' as const, value: 'frontier' },
    ];
    expect(matchesConditions({ region: 'eu', tier: 'frontier' }, conditions)).toBe(true);
    expect(matchesConditions({ region: 'eu', tier: 'economy' }, conditions)).toBe(false);
  });

  it('an empty condition list always matches', () => {
    expect(matchesConditions({}, [])).toBe(true);
  });
});

describe('createGovernanceRulesEngine — createRule / archiveRule / listRules', () => {
  it('createRule() creates an active rule', async () => {
    const { engine } = setup();
    const rule = await engine.createRule(ORG, {
      name: 'Block EU PII to non-EU providers',
      appliesTo: 'provider_usage',
      conditions: [{ attribute: 'region', operator: 'eq', value: 'us' }],
      effect: 'deny',
    });
    expect(rule.status).toBe('active');
  });

  it('archiveRule() sets status archived', async () => {
    const { engine } = setup();
    const rule = await engine.createRule(ORG, { name: 'r', appliesTo: 'runtime_action', conditions: [], effect: 'allow' });
    const archived = await engine.archiveRule(ORG, rule.id);
    expect(archived.status).toBe('archived');
  });

  it('archiveRule() throws GovernanceRuleNotFoundError for an unknown rule', async () => {
    const { engine } = setup();
    await expect(engine.archiveRule(ORG, 'missing')).rejects.toBeInstanceOf(GovernanceRuleNotFoundError);
  });

  it('listRules() filters by appliesTo', async () => {
    const { engine } = setup();
    await engine.createRule(ORG, { name: 'a', appliesTo: 'runtime_action', conditions: [], effect: 'allow' });
    await engine.createRule(ORG, { name: 'b', appliesTo: 'workflow_execution', conditions: [], effect: 'allow' });
    const runtimeRules = await engine.listRules(ORG, 'runtime_action');
    expect(runtimeRules).toHaveLength(1);
  });

  it('supports all five rule targets', async () => {
    const { engine } = setup();
    const targets = ['runtime_action', 'workflow_execution', 'provider_usage', 'communication_request', 'business_operation'] as const;
    for (const appliesTo of targets) {
      const rule = await engine.createRule(ORG, { name: `r-${appliesTo}`, appliesTo, conditions: [], effect: 'allow' });
      expect(rule.appliesTo).toBe(appliesTo);
    }
  });
});

describe('createGovernanceRulesEngine — evaluate', () => {
  it('defaults to allow when no rule matches', async () => {
    const { engine } = setup();
    const result = await engine.evaluate(ORG, { appliesTo: 'runtime_action', attributes: {} });
    expect(result).toEqual({ allowed: true });
  });

  it('deny wins and publishes governance.violation.detected', async () => {
    const eventBus = createGovernanceEventBus();
    const { engine } = setup(eventBus);
    const rule = await engine.createRule(ORG, {
      name: 'Deny high-risk tool calls',
      appliesTo: 'runtime_action',
      conditions: [{ attribute: 'toolId', operator: 'eq', value: 'delete_all' }],
      effect: 'deny',
    });
    let seen: unknown;
    eventBus.subscribe('governance.violation.detected', (payload) => (seen = payload));
    const result = await engine.evaluate(ORG, { appliesTo: 'runtime_action', attributes: { toolId: 'delete_all' } });
    expect(result).toEqual({ allowed: false, matchedRuleId: rule.id, effect: 'deny', reason: rule.name });
    expect(seen).toEqual({ organizationId: ORG, ruleId: rule.id, appliesTo: 'runtime_action', reason: rule.name });
  });

  it('flag allows but surfaces a reason, and does not publish a violation', async () => {
    const eventBus = createGovernanceEventBus();
    const { engine } = setup(eventBus);
    const rule = await engine.createRule(ORG, {
      name: 'Flag unusual provider usage',
      appliesTo: 'provider_usage',
      conditions: [{ attribute: 'providerKind', operator: 'eq', value: 'ollama' }],
      effect: 'flag',
    });
    let violationSeen = false;
    eventBus.subscribe('governance.violation.detected', () => (violationSeen = true));
    const result = await engine.evaluate(ORG, { appliesTo: 'provider_usage', attributes: { providerKind: 'ollama' } });
    expect(result).toEqual({ allowed: true, matchedRuleId: rule.id, effect: 'flag', reason: rule.name });
    expect(violationSeen).toBe(false);
  });

  it('explicit allow rule is reported when matched', async () => {
    const { engine } = setup();
    const rule = await engine.createRule(ORG, {
      name: 'Allow internal communication',
      appliesTo: 'communication_request',
      conditions: [{ attribute: 'channel', operator: 'eq', value: 'internal_chat' }],
      effect: 'allow',
    });
    const result = await engine.evaluate(ORG, { appliesTo: 'communication_request', attributes: { channel: 'internal_chat' } });
    expect(result).toEqual({ allowed: true, matchedRuleId: rule.id, effect: 'allow' });
  });

  it('deny wins over a simultaneously-matching allow rule', async () => {
    const { engine } = setup();
    await engine.createRule(ORG, { name: 'allow-all', appliesTo: 'business_operation', conditions: [], effect: 'allow' });
    const denyRule = await engine.createRule(ORG, { name: 'deny-restricted', appliesTo: 'business_operation', conditions: [], effect: 'deny' });
    const result = await engine.evaluate(ORG, { appliesTo: 'business_operation', attributes: {} });
    expect(result.allowed).toBe(false);
    expect(result.matchedRuleId).toBe(denyRule.id);
  });

  it('among multiple matching deny rules, the lowest id wins deterministically', async () => {
    const { engine } = setup();
    const first = await engine.createRule(ORG, { name: 'deny-a', appliesTo: 'runtime_action', conditions: [], effect: 'deny' });
    const second = await engine.createRule(ORG, { name: 'deny-b', appliesTo: 'runtime_action', conditions: [], effect: 'deny' });
    const expectedWinnerId = [first.id, second.id].sort()[0];
    const result = await engine.evaluate(ORG, { appliesTo: 'runtime_action', attributes: {} });
    expect(result.matchedRuleId).toBe(expectedWinnerId);
  });

  it('archived rules are never matched', async () => {
    const { engine } = setup();
    const rule = await engine.createRule(ORG, { name: 'r', appliesTo: 'runtime_action', conditions: [], effect: 'deny' });
    await engine.archiveRule(ORG, rule.id);
    const result = await engine.evaluate(ORG, { appliesTo: 'runtime_action', attributes: {} });
    expect(result.allowed).toBe(true);
  });

  it('is organization-scoped', async () => {
    const { engine } = setup();
    await engine.createRule(ORG, { name: 'r', appliesTo: 'runtime_action', conditions: [], effect: 'deny' });
    const result = await engine.evaluate('org-2', { appliesTo: 'runtime_action', attributes: {} });
    expect(result.allowed).toBe(true);
  });
});
