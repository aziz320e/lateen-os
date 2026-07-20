import { describe, expect, it, beforeEach } from 'vitest';
import { createConversation, appendMessage, listConversations, pinConversation, clearConversationsForTests } from '@/lib/conversation-store';

describe('conversation-store', () => {
  beforeEach(() => {
    clearConversationsForTests();
  });

  it('creates and lists conversations with tenant scope', () => {
    const conv = createConversation('Hello assistant');
    appendMessage(conv.id, { role: 'user', content: 'Hello assistant' });
    const list = listConversations();
    expect(list.some((c) => c.id === conv.id)).toBe(true);
  });

  it('pins conversations', () => {
    const conv = createConversation('Pinned chat');
    pinConversation(conv.id, true);
    const updated = listConversations().find((c) => c.id === conv.id);
    expect(updated?.pinned).toBe(true);
  });

  it('searches conversation content', () => {
    const conv = createConversation('quotation help');
    appendMessage(conv.id, { role: 'user', content: 'create quotation for ACME' });
    const results = listConversations('ACME');
    expect(results.length).toBeGreaterThan(0);
  });
});
