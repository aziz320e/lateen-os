/**
 * Real conversation runtime — appends messages to a thread, calls the
 * injected {@link StreamingChatProvider} for the agent's reply, persists
 * the updated conversation, and publishes real domain events.
 *
 * @module conversation/conversation.impl
 */
import { randomUUID } from 'node:crypto';
import type { StreamingChatProvider } from '@lateen-os/ai-provider-hub';
import { ProviderError } from '../shared/errors.js';
import type { OrganizationId, RuntimeAgentId } from '../shared/identifiers.js';
import type { Conversation, ConversationMessage, ConversationThread } from './types.js';
import type { ConversationRepository } from './repository.js';
import type { RuntimeEventBus } from '../events/runtime-event-bus.js';

export interface ConversationRuntimeDeps {
  readonly conversationRepository: ConversationRepository;
  readonly chatProvider: StreamingChatProvider;
  readonly eventBus?: RuntimeEventBus;
}

export interface SendMessageInput {
  readonly organizationId: OrganizationId;
  readonly conversationId: string;
  readonly threadId: string;
  readonly content: string;
  readonly modelId: string;
  readonly temperature?: number;
}

export interface ConversationRuntimeService {
  startConversation(
    organizationId: OrganizationId,
    runtimeAgentId: RuntimeAgentId,
    title?: string,
  ): Promise<Conversation>;
  /** Appends the user's message, calls the chat provider for a reply, appends and persists it. Returns the agent's reply. */
  sendMessage(input: SendMessageInput): Promise<ConversationMessage>;
}

function toProviderRole(role: ConversationMessage['role']): 'system' | 'user' | 'assistant' | 'tool' {
  return role === 'agent' ? 'assistant' : role;
}

function toProviderMessages(thread: ConversationThread) {
  return thread.messages.map((message) => ({
    role: toProviderRole(message.role),
    content: message.content,
  }));
}

/** Creates a {@link ConversationRuntimeService} backed by a real chat provider. */
export function createConversationRuntimeService(deps: ConversationRuntimeDeps): ConversationRuntimeService {
  return {
    async startConversation(organizationId, runtimeAgentId, title) {
      const now = new Date().toISOString();
      const conversation: Conversation = {
        id: randomUUID(),
        organizationId,
        createdAt: now,
        updatedAt: now,
        runtimeAgentId,
        title,
        threads: [{ threadId: randomUUID(), messages: [] }],
      };
      await deps.conversationRepository.save(conversation);
      deps.eventBus?.publish('conversation.started', {
        conversationId: conversation.id,
        runtimeAgentId,
      });
      return conversation;
    },

    async sendMessage(input) {
      const conversation = await deps.conversationRepository.findById(input.organizationId, input.conversationId);
      if (!conversation) {
        throw new Error(`Conversation "${input.conversationId}" not found`);
      }
      const thread = conversation.threads.find((candidate) => candidate.threadId === input.threadId);
      if (!thread) {
        throw new Error(`Thread "${input.threadId}" not found in conversation "${input.conversationId}"`);
      }

      const userMessage: ConversationMessage = {
        messageId: randomUUID(),
        role: 'user',
        content: input.content,
        sentAt: new Date().toISOString(),
      };

      let agentMessage: ConversationMessage;
      try {
        const result = await deps.chatProvider.complete({
          modelId: input.modelId,
          messages: [...toProviderMessages(thread), { role: 'user' as const, content: input.content }],
          temperature: input.temperature,
          stream: false,
        });
        agentMessage = {
          messageId: randomUUID(),
          role: 'agent',
          content: result.content,
          sentAt: new Date().toISOString(),
        };
      } catch (error) {
        throw new ProviderError(`Chat completion failed for conversation "${input.conversationId}"`, error);
      }

      const updatedThread: ConversationThread = {
        ...thread,
        messages: [...thread.messages, userMessage, agentMessage],
      };
      const updatedConversation: Conversation = {
        ...conversation,
        updatedAt: new Date().toISOString(),
        threads: conversation.threads.map((candidate) =>
          candidate.threadId === input.threadId ? updatedThread : candidate,
        ),
      };
      await deps.conversationRepository.save(updatedConversation);
      deps.eventBus?.publish('conversation.message_added', {
        conversationId: conversation.id,
        threadId: input.threadId,
        role: 'agent',
      });

      return agentMessage;
    },
  };
}
