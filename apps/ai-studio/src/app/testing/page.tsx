'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { StudioShell } from '@/components/layout/studio-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchWorkers, runSandboxTest } from '@/lib/api/client';
import type { SandboxTestResult } from '@/lib/types/studio';

function TestingContent() {
  const searchParams = useSearchParams();
  const initialWorker = searchParams.get('workerId') ?? 'worker-printing-planner';
  const [workerId, setWorkerId] = useState(initialWorker);
  const [message, setMessage] = useState('Plan production for order ORD-1001');
  const [result, setResult] = useState<SandboxTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: workers } = useQuery({ queryKey: ['workers'], queryFn: fetchWorkers });

  async function handleTest() {
    setLoading(true);
    try {
      setResult(await runSandboxTest(workerId, message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader><CardTitle>Sandbox</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
            {workers?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button onClick={handleTest} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run Sandbox Test'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {result.conversation.map((m, i) => (
                <div key={i} className="rounded-md border p-2"><Badge className="mb-1">{m.role}</Badge><p>{m.content}</p></div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Reasoning Trace</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {result.reasoningTrace.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Metrics</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              <div>Tokens: {result.tokenUsage.prompt + result.tokenUsage.completion}</div>
              <div>Latency: {result.latencyMs}ms</div>
              <div>Cost: ${result.costUsd}</div>
              <div>Valid: {result.outputValid ? 'Yes' : 'No'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Note</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{result.note}</CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default function TestingPage() {
  return (
    <StudioShell title="Testing">
      <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
        <TestingContent />
      </Suspense>
    </StudioShell>
  );
}
