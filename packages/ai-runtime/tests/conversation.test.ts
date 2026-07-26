import { describe, expect, it } from 'vitest';
import type { StreamingChatProvider } from '@lateen-os/ai-provider-hub';
import { createConversationRepository } from '../src/conversation/repository.impl.js';
import { createConversationRuntimeService } from '../src/conversation/conversation.impl.js';
import { createRuntimeEventBus } from '../src/events/runtime-event-bus.js';

const ORG = 'org-1';

function fakeChatProvider(reply: string): StreamingChatProvider {
  return {
    complete: async () => ({
      requestId: 'req-1',
      providerId: 'fake',
      modelId: 'fake-model',
      content: reply,
      promptTokens: 1,
      completionTokens: 1,
      latencyMs: 1,
      finishReason: 'stop',
    }),
    stream: async function* () {},
  };
}

describe('createConversationRuntimeService', () => {
  it('startConversation creates a conversation with one empty thread', async () => {
    const service = createConversationRuntimeService({
      conversationRepository: createConversationRepository(),
      chatProvider: fakeChatProvider('unused'),
    });
    const conversation = await service.startConversation(ORG, 'agent-1', 'My chat');
    expect(conversation.threads).toHaveLength(1);
    expect(conversation.threads[0]!.messages).toHaveLength(0);
    expect(conversation.title).toBe('My chat');
  });

  it('sendMessage appends the user message and the real chat provider reply', async () => {
    const repository = createConversationRepository();
    const service = createConversationRuntimeService({ conversationRepository: repository, chatProvider: fakeChatProvider('Hello back!') });
    const conversation = await service.startConversation(ORG, 'agent-1');

    const reply = await service.sendMessage({
      organizationId: ORG,
      conversationId: conversation.id,
      threadId: conversation.threads[0]!.threadId,
      content: 'Hi there',
      modelId: 'fake-model',
    });

    expect(reply.role).toBe('agent');
    expect(reply.content).toBe('Hello back!');

    const stored = await repository.findById(ORG, conversation.id);
    expect(stored?.threads[0]!.messages).toHaveLength(2);
    expect(stored?.threads[0]!.messages[0]!.role).toBe('user');
  });

  it('publishes conversation.started and conversation.message_added on the event bus', async () => {
    const eventBus = createRuntimeEventBus();
    const events: string[] = [];
    eventBus.subscribeAll((name) => events.push(name));

    const service = createConversationRuntimeService({
      conversationRepository: createConversationRepository(),
      chatProvider: fakeChatProvider('ok'),
      eventBus,
    });
    const conversation = await service.startConversation(ORG, 'agent-1');
    await service.sendMessage({
      organizationId: ORG,
      conversationId: conversation.id,
      threadId: conversation.threads[0]!.threadId,
      content: 'hi',
      modelId: 'fake-model',
    });

    expect(events).toEqual(['conversation.started', 'conversation.message_added']);
  });

  it('wraps a chat provider failure in ProviderError rather than leaking the raw error', async () => {
    const repository = createConversationRepository();
    const failingProvider: StreamingChatProvider = {
      complete: async () => {
        throw new Error('network down');
      },
      stream: async function* () {},
    };
    const service = createConversationRuntimeService({ conversationRepository: repository, chatProvider: failingProvider });
    const conversation = await service.startConversation(ORG, 'agent-1');

    await expect(
      service.sendMessage({
        organizationId: ORG,
        conversationId: conversation.id,
        threadId: conversation.threads[0]!.threadId,
        content: 'hi',
        modelId: 'fake-model',
      }),
    ).rejects.toThrow(/Chat completion failed/);
  });

  it('throws for an unknown conversation id', async () => {
    const service = createConversationRuntimeService({
      conversationRepository: createConversationRepository(),
      chatProvider: fakeChatProvider('ok'),
    });
    await expect(
      service.sendMessage({ organizationId: ORG, conversationId: 'missing', threadId: 'x', content: 'hi', modelId: 'm' }),
    ).rejects.toThrow(/not found/);
  });
});
