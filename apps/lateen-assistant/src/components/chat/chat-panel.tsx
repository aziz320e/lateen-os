'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pin, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChatChart, ChatCodeBlock, ChatTable, MarkdownRenderer } from '@/components/chat/markdown-renderer';
import { listConversations, sendChatMessage } from '@/lib/api/client';
import type { ChatMessage, Conversation } from '@/types';
import { cn } from '@/lib/utils';

export function ChatPanel() {
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    listConversations().then((d) => setConversations(d.conversations)).catch(() => {});
  }, []);

  useEffect(() => {
    const cmd = searchParams.get('cmd');
    if (cmd) {
      setMessage(cmd);
    }
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  async function send(stream = false) {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    setMessage('');
    setLoading(true);
    setStreaming('');

    const tempUser: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMsg,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, tempUser]);

    try {
      if (stream) {
        const response = await sendChatMessage({ message: userMsg, conversationId, stream: true });
        if (!(response instanceof Response)) return;
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            for (const line of chunk.split('\n')) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6)) as { token?: string; done?: boolean; message?: ChatMessage; conversationId?: string };
                if (data.token) {
                  accumulated += data.token;
                  setStreaming(accumulated);
                }
                if (data.done && data.message) {
                  setConversationId(data.conversationId);
                  setMessages((m) => [...m, data.message!]);
                  setStreaming('');
                }
              }
            }
          }
        }
      } else {
        const result = await sendChatMessage({ message: userMsg, conversationId });
        if (result instanceof Response) return;
        setConversationId(result.conversationId);
        setMessages((m) => [...m, result.message]);
      }
      const updated = await listConversations();
      setConversations(updated.conversations);
    } catch {
      setMessages((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: 'assistant', content: 'Sorry, orchestration failed. Check that platform services are running.', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function loadConversation(conv: Conversation) {
    setConversationId(conv.id);
    setMessages(conv.messages);
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card/20">
        <div className="p-3 border-b text-xs font-medium text-muted-foreground">Conversations</div>
        <ul className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => loadConversation(c)}
                className={cn(
                  'w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted',
                  conversationId === c.id && 'bg-muted',
                )}
              >
                <span className="flex items-center gap-1">
                  {c.pinned && <Pin className="h-3 w-3" />}
                  {c.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
          {messages.length === 0 && !streaming && (
            <div className="text-center py-16 space-y-3">
              <Sparkles className="h-10 w-10 mx-auto text-primary" />
              <h1 className="text-xl font-semibold">Lateen Assistant</h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Ask anything or use slash commands — `/help`, `/company-health`, `/launch-product`, `/run-discovery`
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={cn('rounded-lg p-4', m.role === 'user' ? 'bg-primary/10 ml-12' : 'bg-card border mr-12')}>
              {m.role === 'assistant' && m.metadata?.service && (
                <Badge variant="secondary" className="mb-2">{m.metadata.service}</Badge>
              )}
              <MarkdownRenderer content={m.content} />
              {m.metadata?.chart && <ChatChart chart={m.metadata.chart} />}
              {m.metadata?.table && <ChatTable table={m.metadata.table} />}
              {m.metadata?.code && <ChatCodeBlock code={m.metadata.code} />}
            </div>
          ))}

          {streaming && (
            <div className="rounded-lg border bg-card p-4 mr-12">
              <MarkdownRenderer content={streaming} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-4 bg-card/30">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message or /command…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(e.metaKey || e.ctrlKey);
                }
              }}
            />
            <Button onClick={() => send(false)} disabled={loading}>Send</Button>
            <Button variant="secondary" onClick={() => send(true)} disabled={loading} title="Stream response">
              Stream
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
