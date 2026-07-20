'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/portal-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { askAssistant } from '@/lib/api/client';

export default function AssistantPage() {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessage('');
    setHistory((h) => [...h, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const { reply, disclaimer } = await askAssistant(userMsg);
      setHistory((h) => [...h, { role: 'assistant', content: reply }, { role: 'assistant', content: disclaimer }]);
    } catch {
      setHistory((h) => [...h, { role: 'assistant', content: 'Sorry, I could not process that request.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="AI Assistant" description="Customer-safe answers from your account data only" />
      <div className="p-6 md:p-8 max-w-2xl space-y-4">
        <div className="rounded-lg border min-h-[320px] p-4 space-y-3 bg-card">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ask about your projects, orders, quotations, or invoices.</p>
          ) : (
            history.map((m, i) => (
              <div key={i} className={`text-sm rounded-lg px-3 py-2 ${m.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'}`}>
                {m.content}
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask a question…" onKeyDown={(e) => e.key === 'Enter' && send()} />
          <Button onClick={send} disabled={loading}>{loading ? '…' : 'Send'}</Button>
        </div>
      </div>
    </div>
  );
}
