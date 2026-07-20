import { describe, expect, it } from 'vitest';
import { publicEnv } from '../src/lib/env';
import { STUDIO_SECTIONS, FLOW_NODE_TYPES, TRIGGER_TYPES, ACTION_TYPES } from '../src/lib/types/automation';
import { MOCK_AUTOMATIONS, getAutomation } from '../src/lib/mock-data';

describe('automation-studio env', () => {
  it('defaults workflow base URL', () => {
    expect(publicEnv.workflowBaseUrl).toBe('http://localhost:4008');
  });
});

describe('automation-studio contracts', () => {
  it('defines 17 studio sections', () => {
    expect(STUDIO_SECTIONS.length).toBe(17);
  });

  it('defines 21 flow node types', () => {
    expect(FLOW_NODE_TYPES.length).toBe(21);
  });

  it('defines 11 trigger types', () => {
    expect(TRIGGER_TYPES.length).toBe(11);
  });

  it('defines 14 action types', () => {
    expect(ACTION_TYPES.length).toBe(14);
  });

  it('resolves mock automations', () => {
    expect(getAutomation('auto-sales-followup')?.name).toBe('Sales Follow-up');
    expect(MOCK_AUTOMATIONS.length).toBeGreaterThanOrEqual(3);
  });
});
