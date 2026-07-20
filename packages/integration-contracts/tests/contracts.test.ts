import { describe, expect, it } from 'vitest';
import type { ConnectorProvider, SyncMode, WebhookEventType } from '../src/index.js';

describe('integration-contracts', () => {
  it('exports contract types', () => {
    const modes: SyncMode[] = ['manual', 'scheduled', 'realtime', 'bidirectional'];
    const events: WebhookEventType[] = ['installed', 'connected', 'sync_completed'];
    expect(modes.length).toBe(4);
    expect(events.length).toBe(3);

    const providerShape: Partial<ConnectorProvider> = {
      definitionCode: 'test',
    };
    expect(providerShape.definitionCode).toBe('test');
  });
});
