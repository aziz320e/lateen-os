import { describe, expect, it } from 'vitest';
import { simulateLaunchProductMission, getMissionProgress } from '../src/simulator.js';
import { LAUNCH_PRODUCT_STAGES } from '../src/stages.js';
import { LAUNCH_PRODUCT_EVENT_NAMES } from '../src/events.js';

describe('Launch Product Mission — happy path', () => {
  it('completes all 12 stages', () => {
    const { mission } = simulateLaunchProductMission({ scenario: 'happy_path' });
    expect(mission.status).toBe('completed');
    expect(mission.stages).toHaveLength(LAUNCH_PRODUCT_STAGES.length);
    expect(mission.consensusReached).toBe(true);
    expect(mission.decisionApproved).toBe(true);
    expect(mission.outputs.approvedProduct).toBeDefined();
    expect(mission.outputs.memoryEntry).toBeDefined();
    expect(getMissionProgress(mission)).toBe(100);
  });

  it('emits MissionStarted and MissionCompleted events', () => {
    const { mission } = simulateLaunchProductMission({ scenario: 'happy_path' });
    const names = mission.events.map((e) => e.eventName);
    expect(names).toContain(LAUNCH_PRODUCT_EVENT_NAMES.MissionStarted);
    expect(names).toContain(LAUNCH_PRODUCT_EVENT_NAMES.MissionCompleted);
    expect(names).toContain(LAUNCH_PRODUCT_EVENT_NAMES.ConsensusReached);
    expect(names).toContain(LAUNCH_PRODUCT_EVENT_NAMES.DecisionApproved);
  });
});

describe('Launch Product Mission — escalation path', () => {
  it('escalates at marketing review then completes', () => {
    const { mission } = simulateLaunchProductMission({ scenario: 'escalation_path' });
    expect(mission.events.some((e) => e.eventName === LAUNCH_PRODUCT_EVENT_NAMES.MissionEscalated)).toBe(true);
    expect(mission.status).toBe('completed');
    expect(mission.health).not.toBe('critical');
  });
});

describe('Launch Product Mission — rejected path', () => {
  it('fails at decision engine', () => {
    const { mission } = simulateLaunchProductMission({ scenario: 'rejected_path' });
    expect(mission.status).toBe('failed');
    expect(mission.decisionApproved).toBe(false);
    expect(mission.outputs.approvedProduct).toBeUndefined();
    expect(mission.health).toBe('critical');
  });
});

describe('Launch Product Mission — retry path', () => {
  it('retries product discovery then completes', () => {
    const { mission } = simulateLaunchProductMission({ scenario: 'retry_path' });
    const discovery = mission.stages.find((s) => s.code === 'product_discovery');
    expect(discovery?.attempts).toBeGreaterThan(1);
    expect(mission.status).toBe('completed');
  });
});

describe('Launch Product Mission — definition', () => {
  it('has 12 stages in order', () => {
    expect(LAUNCH_PRODUCT_STAGES[0]?.code).toBe('trend_detected');
    expect(LAUNCH_PRODUCT_STAGES[11]?.code).toBe('workflow_completed');
  });
});
