/**
 * Channels — Email, SMS, WhatsApp, Internal Chat, and Webhook
 * providers, each deterministically falling back to an in-memory
 * simulation when not configured with a real sender.
 * @module channel
 */
export * from './types.js';
export { createChannelProvider } from './provider.impl.js';
export { createChannelRegistry, type ChannelRegistry, type ChannelSendFunctions } from './registry.impl.js';
