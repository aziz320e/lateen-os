'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { StudioShell } from '@/components/layout/studio-shell';
import { ExecutionTimeline } from '@/components/executions/execution-timeline';
import { Button } from '@/components/ui/button';
import { fetchExecution } from '@/lib/api/client';

export default function ExecutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: execution, isLoading, error } = useQuery({ queryKey: ['execution', id], queryFn: () => fetchExecution(id) });

  return (
    <StudioShell title="Execution Detail">
      <Button variant="ghost" size="sm" className="mb-4" asChild><Link href="/executions">← Back to Executions</Link></Button>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-red-400">Execution not found</p>}
      {execution && <ExecutionTimeline execution={execution} />}
    </StudioShell>
  );
}
