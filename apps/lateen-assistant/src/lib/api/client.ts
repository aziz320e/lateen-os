import type { ChatMessage, CommandDefinition, Conversation, ConversationContext, MemoryEntry, SearchResult, TablePayload, ChartPayload } from '@/types';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `API ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function sendChatMessage(input: { message: string; conversationId?: string; stream?: boolean }): Promise<
  Response | { conversationId: string; message: ChatMessage; traceId: string }
> {
  if (input.stream) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, stream: true }),
    });
    if (!response.ok) throw new Error('Chat stream failed');
    return response;
  }
  return apiFetch<{ conversationId: string; message: ChatMessage; traceId: string }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listConversations(q?: string) {
  const params = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiFetch<{ conversations: Conversation[] }>(`/api/chat${params}`);
}

export async function fetchContext() {
  return apiFetch<{ context: ConversationContext; traces: unknown[] }>('/api/context');
}

export async function fetchCommands(q?: string) {
  const params = q ? `?q=${encodeURIComponent(q)}` : '';
  const data = await apiFetch<{ commands: CommandDefinition[] }>(`/api/commands${params}`);
  return data.commands;
}

export async function sendCommand(command: string, conversationId?: string) {
  return apiFetch<{ markdown: string; traceId: string; table?: TablePayload; chart?: ChartPayload }>('/api/commands', {
    method: 'POST',
    body: JSON.stringify({ command, conversationId }),
  });
}

export async function searchPlatform(q: string) {
  return apiFetch<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`);
}

export async function fetchMemory(category?: string) {
  const params = category ? `?category=${category}` : '';
  return apiFetch<{ entries: MemoryEntry[] }>(`/api/memory${params}`);
}

export async function fetchMissions() {
  return apiFetch<{ missions: unknown[]; groups: Record<string, unknown[]> }>('/api/missions');
}

export async function missionAction(action: 'start' | 'retry' | 'escalate', input?: { opportunityTitle?: string; missionId?: string }) {
  return apiFetch<unknown>('/api/missions', { method: 'POST', body: JSON.stringify({ action, ...input }) });
}

export async function fetchWorkflows() {
  return apiFetch<{ workflows: unknown[]; groups: Record<string, unknown[]> }>('/api/workflows');
}

export async function workflowAction(action: 'start' | 'pause' | 'resume' | 'cancel', workflowId?: string) {
  return apiFetch<unknown>('/api/workflows', { method: 'POST', body: JSON.stringify({ action, workflowId }) });
}

export async function fetchDecisionsViaChat() {
  return sendCommand('/explain-decisions');
}
