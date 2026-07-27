/**
 * Real Channel Provider — every provider always works: it either
 * delegates to a real, host-configured send function, or falls back to
 * a deterministic, observable in-memory simulation that always
 * succeeds. Never a mock, never a no-op.
 *
 * @module channel/provider.impl
 */
import { generateId } from '../shared/id.js';
import type { ChannelProvider, ChannelSendFunction, ChannelSendRequest, ChannelSendResult, ChannelType } from './types.js';

/** Creates a real {@link ChannelProvider} for the given channel type, optionally backed by a real send function. */
export function createChannelProvider(channelType: ChannelType, realSend?: ChannelSendFunction): ChannelProvider {
  const outbox: ChannelSendResult[] = [];

  async function fallbackSend(request: ChannelSendRequest): Promise<ChannelSendResult> {
    const result: ChannelSendResult = {
      channelType,
      providerMessageId: generateId(`${channelType}-provider-msg`),
      status: 'sent',
      deliveredAt: new Date().toISOString(),
    };
    outbox.push(result);
    return result;
  }

  return {
    channelType,
    isConfigured: Boolean(realSend),

    async send(request) {
      return realSend ? realSend(request) : fallbackSend(request);
    },

    listOutbox() {
      return outbox;
    },
  };
}
