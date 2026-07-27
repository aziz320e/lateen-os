/**
 * Real Channel Registry — the 5 required providers (Email, SMS,
 * WhatsApp, Internal Chat, Webhook), each a real {@link ChannelProvider}
 * that deterministically falls back to an in-memory simulation when no
 * real send function is configured for it.
 *
 * @module channel/registry.impl
 */
import { createChannelProvider } from './provider.impl.js';
import type { ChannelProvider, ChannelSendFunction, ChannelSendRequest, ChannelSendResult, ChannelType } from './types.js';

const CHANNEL_TYPES: readonly ChannelType[] = ['email', 'sms', 'whatsapp', 'internal_chat', 'webhook'];

/** Real send functions, keyed by channel type — wired in by the host application when a live provider is configured. */
export type ChannelSendFunctions = Partial<Record<ChannelType, ChannelSendFunction>>;

export interface ChannelRegistry {
  get(channelType: ChannelType): ChannelProvider;
  send(channelType: ChannelType, request: ChannelSendRequest): Promise<ChannelSendResult>;
}

/** Creates a real {@link ChannelRegistry} with all 5 required providers, each optionally backed by a real send function. */
export function createChannelRegistry(sendFunctions: ChannelSendFunctions = {}): ChannelRegistry {
  const providers = new Map<ChannelType, ChannelProvider>(
    CHANNEL_TYPES.map((channelType) => [channelType, createChannelProvider(channelType, sendFunctions[channelType])]),
  );

  return {
    get(channelType) {
      return providers.get(channelType)!;
    },
    async send(channelType, request) {
      return providers.get(channelType)!.send(request);
    },
  };
}
