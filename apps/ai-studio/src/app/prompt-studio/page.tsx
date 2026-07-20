'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { PromptEditor } from '@/components/prompt-studio/prompt-editor';
import { fetchPrompt, fetchWorkers } from '@/lib/api/client';

function PromptStudioContent() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get('workerId') ?? 'worker-printing-planner';

  const { data: workers } = useQuery({ queryKey: ['workers'], queryFn: fetchWorkers });
  const { data: prompt, isLoading } = useQuery({ queryKey: ['prompt', workerId], queryFn: () => fetchPrompt(workerId) });

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-muted-foreground" htmlFor="worker-select">Worker</label>
        <select
          id="worker-select"
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
          value={workerId}
          onChange={(e) => { window.location.href = `/prompt-studio?workerId=${e.target.value}`; }}
        >
          {workers?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading prompt...</p>}
      {!isLoading && !prompt && <p className="text-muted-foreground">No prompt design for this worker yet.</p>}
      {prompt && <PromptEditor prompt={prompt} />}
    </>
  );
}

export default function PromptStudioPage() {
  return (
    <StudioShell title="Prompt Studio">
      <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
        <PromptStudioContent />
      </Suspense>
    </StudioShell>
  );
}
