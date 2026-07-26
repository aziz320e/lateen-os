import { describe, expect, it } from 'vitest';
import { tallyProposalVotes, type ProposalVote } from '../src/conflict/resolver.impl.js';

const W1 = 'worker-1';
const W2 = 'worker-2';
const W3 = 'worker-3';
const PROPOSAL_A = 'proposal-a';
const PROPOSAL_B = 'proposal-b';

describe('tallyProposalVotes', () => {
  it('picks the proposal with the most role-weighted votes', () => {
    const votes: ProposalVote[] = [
      { workerId: W1, role: 'ceo_ai', proposalId: PROPOSAL_A },
      { workerId: W2, role: 'sales_ai', proposalId: PROPOSAL_B },
      { workerId: W3, role: 'finance_ai', proposalId: PROPOSAL_B },
    ];
    // A: ceo_ai weight 3. B: sales_ai(1) + finance_ai(1) = 2. A wins.
    const outcome = tallyProposalVotes(votes);
    expect(outcome.winningProposalId).toBe(PROPOSAL_A);
    expect(outcome.tied).toBe(false);
  });

  it('detects a tie and returns no winner', () => {
    const votes: ProposalVote[] = [
      { workerId: W1, role: 'sales_ai', proposalId: PROPOSAL_A },
      { workerId: W2, role: 'finance_ai', proposalId: PROPOSAL_B },
    ];
    const outcome = tallyProposalVotes(votes);
    expect(outcome.tied).toBe(true);
    expect(outcome.winningProposalId).toBeUndefined();
  });

  it('treats zero votes as a tie with no winner', () => {
    const outcome = tallyProposalVotes([]);
    expect(outcome.tied).toBe(true);
    expect(outcome.winningProposalId).toBeUndefined();
  });

  it('accumulates weight across multiple votes for the same proposal', () => {
    const votes: ProposalVote[] = [
      { workerId: W1, role: 'sales_ai', proposalId: PROPOSAL_A },
      { workerId: W2, role: 'marketing_ai', proposalId: PROPOSAL_A },
      { workerId: W3, role: 'ceo_ai', proposalId: PROPOSAL_B },
    ];
    // A: 1+1=2. B: ceo_ai=3. B wins.
    expect(tallyProposalVotes(votes).winningProposalId).toBe(PROPOSAL_B);
  });
});
