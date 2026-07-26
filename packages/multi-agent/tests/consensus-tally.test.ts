import { describe, expect, it } from 'vitest';
import { tallyVotes, type Vote } from '../src/consensus/service.impl.js';

const W1 = 'worker-1';
const W2 = 'worker-2';
const W3 = 'worker-3';

describe('tallyVotes', () => {
  it('unanimous strategy requires every vote to approve', () => {
    const allApprove: Vote[] = [
      { workerId: W1, role: 'ceo_ai', approve: true },
      { workerId: W2, role: 'sales_ai', approve: true },
    ];
    expect(tallyVotes('unanimous', allApprove)).toEqual({ reached: true, score: '1.00' });

    const oneDissent: Vote[] = [...allApprove, { workerId: W3, role: 'finance_ai', approve: false }];
    expect(tallyVotes('unanimous', oneDissent).reached).toBe(false);
  });

  it('majority strategy reaches consensus above 50%', () => {
    const votes: Vote[] = [
      { workerId: W1, role: 'sales_ai', approve: true },
      { workerId: W2, role: 'finance_ai', approve: true },
      { workerId: W3, role: 'operations_ai', approve: false },
    ];
    const result = tallyVotes('majority', votes);
    expect(result.reached).toBe(true);
    expect(result.score).toBe('0.67');
  });

  it('majority strategy fails at exactly 50%', () => {
    const votes: Vote[] = [
      { workerId: W1, role: 'sales_ai', approve: true },
      { workerId: W2, role: 'finance_ai', approve: false },
    ];
    expect(tallyVotes('majority', votes).reached).toBe(false);
  });

  it('weighted_by_role strategy weighs ceo_ai heavier than others', () => {
    const ceoApproves: Vote[] = [
      { workerId: W1, role: 'ceo_ai', approve: true },
      { workerId: W2, role: 'sales_ai', approve: false },
    ];
    // ceo_ai weight 3 vs sales_ai weight 1 -> 3/4 = 0.75, reached
    expect(tallyVotes('weighted_by_role', ceoApproves).reached).toBe(true);

    const ceoRejects: Vote[] = [
      { workerId: W1, role: 'ceo_ai', approve: false },
      { workerId: W2, role: 'sales_ai', approve: true },
      { workerId: W3, role: 'finance_ai', approve: true },
    ];
    // ceo_ai weight 3 (reject) vs 1+1 (approve) = 2/5 = 0.40, not reached
    expect(tallyVotes('weighted_by_role', ceoRejects).reached).toBe(false);
  });

  it('leader_veto strategy blocks consensus when the leader dissents, even with a majority', () => {
    const votes: Vote[] = [
      { workerId: W1, role: 'ceo_ai', approve: false },
      { workerId: W2, role: 'sales_ai', approve: true },
      { workerId: W3, role: 'finance_ai', approve: true },
    ];
    const result = tallyVotes('leader_veto', votes, W1);
    expect(result.reached).toBe(false);
  });

  it('leader_veto strategy reaches consensus when the leader approves and majority holds', () => {
    const votes: Vote[] = [
      { workerId: W1, role: 'ceo_ai', approve: true },
      { workerId: W2, role: 'sales_ai', approve: true },
      { workerId: W3, role: 'finance_ai', approve: false },
    ];
    expect(tallyVotes('leader_veto', votes, W1).reached).toBe(true);
  });

  it('decision_engine strategy never resolves by vote alone', () => {
    const votes: Vote[] = [{ workerId: W1, role: 'ceo_ai', approve: true }];
    expect(tallyVotes('decision_engine', votes)).toEqual({ reached: false, score: '0.00' });
  });

  it('returns not-reached for zero votes', () => {
    expect(tallyVotes('majority', [])).toEqual({ reached: false, score: '0.00' });
  });
});
