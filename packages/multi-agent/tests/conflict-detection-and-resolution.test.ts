import { describe, expect, it } from 'vitest';
import { createMultiAgentRuntime } from '../src/runtime.js';

const ORG = 'org-1';
const MISSION = 'mission-1';

async function setupCompetingProposals(runtime: ReturnType<typeof createMultiAgentRuntime>) {
  const conversation = await runtime.communicationBus.createConversation(ORG, MISSION, 'Pricing debate', ['marketing-worker', 'finance-worker']);
  const discussion = await runtime.communicationBus.openDiscussion(ORG, conversation.id, 'Discount strategy', [
    'marketing-worker',
    'finance-worker',
  ]);

  const proposalA = await runtime.communicationBus.propose({
    organizationId: ORG,
    conversationId: conversation.id,
    discussionId: discussion.id,
    proposerWorkerId: 'marketing-worker',
    title: 'Aggressive discount',
    rationale: 'Drives volume',
    proposedAction: 'apply_20_percent_discount',
  });
  const proposalB = await runtime.communicationBus.propose({
    organizationId: ORG,
    conversationId: conversation.id,
    discussionId: discussion.id,
    proposerWorkerId: 'finance-worker',
    title: 'Conservative discount',
    rationale: 'Protects margin',
    proposedAction: 'apply_5_percent_discount',
  });

  return { conversation, discussion, proposalA, proposalB };
}

describe('Integration: Conflict Detection', () => {
  it('detects a conflict when two proposals compete in the same discussion', async () => {
    const runtime = createMultiAgentRuntime();
    const { discussion, conversation } = await setupCompetingProposals(runtime);

    const conflict = await runtime.conflictDetector.detect(ORG, MISSION, conversation.id, discussion.id);
    expect(conflict?.status).toBe('detected');
    expect(conflict?.competingProposalIds).toHaveLength(2);
  });

  it('returns null when there is only one proposal', async () => {
    const runtime = createMultiAgentRuntime();
    const conversation = await runtime.communicationBus.createConversation(ORG, MISSION, 'Solo proposal', ['a']);
    const discussion = await runtime.communicationBus.openDiscussion(ORG, conversation.id, 'Topic', ['a']);
    await runtime.communicationBus.propose({
      organizationId: ORG,
      conversationId: conversation.id,
      discussionId: discussion.id,
      proposerWorkerId: 'a',
      title: 'Only option',
      rationale: 'No competition',
      proposedAction: 'do_it',
    });

    const conflict = await runtime.conflictDetector.detect(ORG, MISSION, conversation.id, discussion.id);
    expect(conflict).toBeNull();
  });
});

describe('Integration: Conflict Resolution', () => {
  it('resolves by role-weighted vote and marks the winning/losing proposals', async () => {
    const runtime = createMultiAgentRuntime();
    const { conversation, discussion, proposalA, proposalB } = await setupCompetingProposals(runtime);
    const conflict = await runtime.conflictDetector.detect(ORG, MISSION, conversation.id, discussion.id);

    const resolved = await runtime.conflictResolver.resolveByVote(ORG, conflict!.id, [
      { workerId: 'ceo-worker', role: 'ceo_ai', proposalId: proposalB.id }, // finance's conservative option
      { workerId: 'marketing-worker', role: 'marketing_ai', proposalId: proposalA.id },
    ]);

    expect(resolved.status).toBe('resolved');
    expect(resolved.winningProposalId).toBe(proposalB.id); // ceo_ai weight 3 beats marketing_ai weight 1
  });

  it('stays "resolving" on a tie instead of picking an arbitrary winner', async () => {
    const runtime = createMultiAgentRuntime();
    const { conversation, discussion, proposalA, proposalB } = await setupCompetingProposals(runtime);
    const conflict = await runtime.conflictDetector.detect(ORG, MISSION, conversation.id, discussion.id);

    const outcome = await runtime.conflictResolver.resolveByVote(ORG, conflict!.id, [
      { workerId: 'marketing-worker', role: 'marketing_ai', proposalId: proposalA.id },
      { workerId: 'sales-worker', role: 'sales_ai', proposalId: proposalB.id },
    ]);

    expect(outcome.status).toBe('resolving');
    expect(outcome.winningProposalId).toBeUndefined();
  });

  it('resolveByLeaderDecision picks a winner directly, bypassing voting', async () => {
    const runtime = createMultiAgentRuntime();
    const { conversation, discussion, proposalA } = await setupCompetingProposals(runtime);
    const conflict = await runtime.conflictDetector.detect(ORG, MISSION, conversation.id, discussion.id);

    const resolved = await runtime.conflictResolver.resolveByLeaderDecision(ORG, conflict!.id, proposalA.id, 'Leader override for speed to market.');
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolutionMethod).toBe('leader_decision');
    expect(resolved.winningProposalId).toBe(proposalA.id);
  });

  it('escalate raises a real escalation request and marks the conflict escalated', async () => {
    const runtime = createMultiAgentRuntime();
    const { conversation, discussion } = await setupCompetingProposals(runtime);
    const conflict = await runtime.conflictDetector.detect(ORG, MISSION, conversation.id, discussion.id);

    const { conflict: escalated, escalationRequestId } = await runtime.conflictResolver.escalate(
      ORG,
      conflict!.id,
      MISSION,
      'No consensus reachable by vote',
      'ceo-worker',
    );
    expect(escalated.status).toBe('escalated');
    expect(escalationRequestId).toBeTruthy();
  });
});
