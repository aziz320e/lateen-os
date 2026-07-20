'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { StudioShell } from '@/components/layout/studio-shell';
import { WorkerDesigner } from '@/components/worker-designer/worker-designer';
import { Button } from '@/components/ui/button';
import { fetchWorker } from '@/lib/api/client';

export default function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: worker, isLoading, error } = useQuery({ queryKey: ['worker', id], queryFn: () => fetchWorker(id) });

  return (
    <StudioShell title="Worker Designer">
      <Button variant="ghost" size="sm" className="mb-4" asChild><Link href="/workers">← Back to Workers</Link></Button>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-red-400">Worker not found</p>}
      {worker && <WorkerDesigner worker={worker} />}
    </StudioShell>
  );
}
