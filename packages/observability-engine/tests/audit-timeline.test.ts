import { describe, expect, it } from 'vitest';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createAuditTimelineRepository } from '../src/audit-timeline/repository.impl.js';
import { createAuditTimelineEngine } from '../src/audit-timeline/engine.impl.js';

const ORG = 'org-1';

function setup() {
  const repository = createAuditTimelineRepository();
  return { repository };
}

describe('createAuditTimelineEngine — offline (no collaborators injected)', () => {
  it('returns an empty timeline', async () => {
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository);
    expect(await engine.aggregateTimeline(ORG)).toEqual([]);
  });
});

describe('createAuditTimelineEngine — security (real AI Security Engine)', () => {
  it('aggregates real security violations', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authentication.validateToken(ORG, 'not-a-real-token');
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository, { aiSecurity });
    const entries = await engine.aggregateTimeline(ORG);
    expect(entries.some((entry) => entry.source === 'security')).toBe(true);
  });
});

describe('createAuditTimelineEngine — governance (real AI Governance Engine)', () => {
  it('aggregates real governance decisions', async () => {
    const aiGovernance = createGovernanceRuntime();
    await aiGovernance.decisions.recordDecision(ORG, { decisionType: 'agent_approval', subjectId: 'agent-1', outcome: 'approved', reviewerId: 'reviewer-1' });
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository, { aiGovernance });
    const entries = await engine.aggregateTimeline(ORG);
    expect(entries.some((entry) => entry.source === 'governance')).toBe(true);
  });
});

describe('createAuditTimelineEngine — compliance (real AI Compliance Engine)', () => {
  it('aggregates real compliance audits', async () => {
    const aiCompliance = createComplianceRuntime();
    const framework = await aiCompliance.frameworks.create(ORG, { frameworkCode: 'SOC2', name: 'SOC 2' });
    await aiCompliance.audits.createAuditPlan(ORG, { frameworkId: framework.id, title: 'Annual audit' });
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository, { aiCompliance });
    const entries = await engine.aggregateTimeline(ORG);
    expect(entries.some((entry) => entry.source === 'compliance')).toBe(true);
  });
});

describe('createAuditTimelineEngine — workflow (real Workflow Engine)', () => {
  it('aggregates real workflow instances', async () => {
    const workflow = createWorkflowRuntime();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'test.audit',
      name: 'Test Audit',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'work', name: 'Work', type: 'human', optional: false }],
      transitions: [],
    });
    await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository, { workflow });
    const entries = await engine.aggregateTimeline(ORG);
    expect(entries.some((entry) => entry.source === 'workflow')).toBe(true);
  });
});

describe('createAuditTimelineEngine — communication (real Communication Hub)', () => {
  it('aggregates real timeline entries', async () => {
    const communicationHub = createCommunicationRuntime();
    const conversation = await communicationHub.conversations.create(ORG, { conversationType: 'customer' });
    await communicationHub.messages.create(ORG, { conversationId: conversation.id, messageType: 'text', body: 'hi' });
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository, { communicationHub });
    const entries = await engine.aggregateTimeline(ORG);
    expect(entries.some((entry) => entry.source === 'communication')).toBe(true);
  });
});

describe('createAuditTimelineEngine — ordering, persistence, and querying', () => {
  it('sorts entries most-recent-first', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authentication.validateToken(ORG, 'bad-1');
    await new Promise((resolve) => setTimeout(resolve, 2));
    await aiSecurity.authentication.validateToken(ORG, 'bad-2');
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository, { aiSecurity });
    const entries = await engine.aggregateTimeline(ORG);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1]!.occurredAt >= entries[i]!.occurredAt).toBe(true);
    }
  });

  it('persists every aggregated entry, queryable via list()/findBySource()', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authentication.validateToken(ORG, 'bad');
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository, { aiSecurity });
    await engine.aggregateTimeline(ORG);
    expect(await engine.list(ORG)).not.toHaveLength(0);
    expect(await engine.findBySource(ORG, 'security')).not.toHaveLength(0);
  });

  it('get() returns null for an unknown entry', async () => {
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository);
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authentication.validateToken(ORG, 'bad');
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository, { aiSecurity });
    const [entry] = await engine.aggregateTimeline(ORG);
    expect(await repository.findById('org-2', entry!.id)).toBeNull();
  });

  it('findBySource returns an empty array for a source with no entries', async () => {
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository);
    expect(await engine.findBySource(ORG, 'workflow')).toEqual([]);
  });

  it('list() returns an empty array before any aggregation has run', async () => {
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository);
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('accepts an injectable now() clock for the entry\'s createdAt/updatedAt', async () => {
    const fixed = '2026-03-01T00:00:00.000Z';
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authentication.validateToken(ORG, 'bad');
    const { repository } = setup();
    const engine = createAuditTimelineEngine(repository, { aiSecurity }, () => fixed);
    const [entry] = await engine.aggregateTimeline(ORG);
    expect(entry!.createdAt).toBe(fixed);
  });
});
