import { describe, expect, it } from 'vitest';
import { createChannelProvider } from '../src/channel/provider.impl.js';
import { createChannelRegistry } from '../src/channel/registry.impl.js';
import type { ChannelSendResult, ChannelType } from '../src/channel/types.js';

const ORG = 'org-1';

describe('createChannelProvider — deterministic in-memory fallback', () => {
  it('is not configured when no real send function is given', () => {
    const provider = createChannelProvider('email');
    expect(provider.isConfigured).toBe(false);
  });

  it('always succeeds via the fallback and records the attempt in the outbox', async () => {
    const provider = createChannelProvider('sms');
    const result = await provider.send({ organizationId: ORG, messageId: 'message-1', recipient: '+15551234567', body: 'Hi' });
    expect(result.status).toBe('sent');
    expect(result.channelType).toBe('sms');
    expect(result.providerMessageId).toBeDefined();
    expect(provider.listOutbox()).toHaveLength(1);
  });

  it('accumulates every fallback send in the outbox', async () => {
    const provider = createChannelProvider('whatsapp');
    await provider.send({ organizationId: ORG, messageId: 'message-1' });
    await provider.send({ organizationId: ORG, messageId: 'message-2' });
    expect(provider.listOutbox()).toHaveLength(2);
  });

  it('delegates to a real send function when configured', async () => {
    const realResult: ChannelSendResult = { channelType: 'email', providerMessageId: 'real-123', status: 'sent', deliveredAt: '2026-01-01T00:00:00.000Z' };
    const provider = createChannelProvider('email', async () => realResult);
    expect(provider.isConfigured).toBe(true);
    const result = await provider.send({ organizationId: ORG, messageId: 'message-1' });
    expect(result).toBe(realResult);
    expect(provider.listOutbox()).toHaveLength(0);
  });

  it('surfaces a real send function failure without falling back', async () => {
    const failure: ChannelSendResult = { channelType: 'webhook', providerMessageId: 'real-456', status: 'failed', errorMessage: 'Connection refused' };
    const provider = createChannelProvider('webhook', async () => failure);
    const result = await provider.send({ organizationId: ORG, messageId: 'message-1' });
    expect(result.status).toBe('failed');
    expect(result.errorMessage).toBe('Connection refused');
  });
});

describe('createChannelRegistry', () => {
  it('constructs all 5 required providers', () => {
    const registry = createChannelRegistry();
    const types: readonly ChannelType[] = ['email', 'sms', 'whatsapp', 'internal_chat', 'webhook'];
    for (const channelType of types) {
      expect(registry.get(channelType).channelType).toBe(channelType);
    }
  });

  it('every provider defaults to the deterministic in-memory fallback when unconfigured', () => {
    const registry = createChannelRegistry();
    expect(registry.get('email').isConfigured).toBe(false);
    expect(registry.get('sms').isConfigured).toBe(false);
    expect(registry.get('whatsapp').isConfigured).toBe(false);
    expect(registry.get('internal_chat').isConfigured).toBe(false);
    expect(registry.get('webhook').isConfigured).toBe(false);
  });

  it('configures only the channels given a real send function', () => {
    const registry = createChannelRegistry({ email: async (request) => ({ channelType: 'email', providerMessageId: 'x', status: 'sent' }) });
    expect(registry.get('email').isConfigured).toBe(true);
    expect(registry.get('sms').isConfigured).toBe(false);
  });

  it('send() delegates to the resolved provider', async () => {
    const registry = createChannelRegistry();
    const result = await registry.send('internal_chat', { organizationId: ORG, messageId: 'message-1' });
    expect(result.channelType).toBe('internal_chat');
    expect(result.status).toBe('sent');
  });
});
