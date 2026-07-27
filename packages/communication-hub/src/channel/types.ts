/** @module channel/types */

/** Deterministic outbound channel provider. */
export type ChannelType = 'email' | 'sms' | 'whatsapp' | 'internal_chat' | 'webhook';

/** A request to deliver one message through a channel provider. */
export interface ChannelSendRequest {
  readonly organizationId: string;
  readonly messageId: string;
  readonly recipient?: string;
  readonly body?: string;
}

/** The result of attempting delivery through a channel provider. */
export interface ChannelSendResult {
  readonly channelType: ChannelType;
  readonly providerMessageId: string;
  readonly status: 'sent' | 'failed';
  readonly deliveredAt?: string;
  readonly errorMessage?: string;
}

/** A real send function backing a channel — wired in by the host application when a live provider is configured. */
export type ChannelSendFunction = (request: ChannelSendRequest) => Promise<ChannelSendResult>;

/** A single deterministic channel provider. */
export interface ChannelProvider {
  readonly channelType: ChannelType;
  /** `true` when a real, host-provided send function is configured; `false` when using the deterministic in-memory fallback. */
  readonly isConfigured: boolean;
  send(request: ChannelSendRequest): Promise<ChannelSendResult>;
  /** Every send attempt handled by the deterministic in-memory fallback, oldest first — for test/inspection only. */
  listOutbox(): readonly ChannelSendResult[];
}
