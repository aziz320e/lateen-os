import { randomUUID } from 'node:crypto';
import type { ChatMessage, Conversation } from '@/types';
import { getOrganizationId } from './auth';
import { getAuthSubject } from './auth';

const conversations = new Map<string, Conversation>();

function defaultTitle(firstMessage: string): string {
  return firstMessage.slice(0, 48) + (firstMessage.length > 48 ? '…' : '');
}

export function createConversation(firstMessage?: string): Conversation {
  const id = randomUUID();
  const now = new Date().toISOString();
  const conv: Conversation = {
    id,
    title: firstMessage ? defaultTitle(firstMessage) : 'New conversation',
    organizationId: getOrganizationId(),
    userId: getAuthSubject(),
    pinned: false,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  conversations.set(id, conv);
  return conv;
}

export function getConversation(id: string): Conversation | undefined {
  const c = conversations.get(id);
  if (!c || c.organizationId !== getOrganizationId()) return undefined;
  return c;
}

export function listConversations(query?: string): Conversation[] {
  const orgId = getOrganizationId();
  let list = [...conversations.values()]
    .filter((c) => c.organizationId === orgId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (query?.trim()) {
    const q = query.toLowerCase();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q)),
    );
  }
  return list;
}

export function appendMessage(conversationId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage {
  const conv = getConversation(conversationId);
  if (!conv) throw new Error('Conversation not found');

  const full: ChatMessage = {
    ...message,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  conv.messages.push(full);
  conv.updatedAt = full.createdAt;
  conversations.set(conversationId, conv);
  return full;
}

export function pinConversation(id: string, pinned: boolean): Conversation | undefined {
  const conv = getConversation(id);
  if (!conv) return undefined;
  conv.pinned = pinned;
  conversations.set(id, conv);
  return conv;
}

export function clearConversationsForTests(): void {
  conversations.clear();
}
