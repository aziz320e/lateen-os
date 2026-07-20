'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/portal-shell';
import { Badge } from '@/components/ui/badge';
import { Skeleton, EmptyState } from '@/components/ui/state';
import { fetchProject } from '@/lib/api/client';
import { cn, formatDate, statusColor } from '@/lib/utils';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, error } = useQuery({ queryKey: ['project', id], queryFn: () => fetchProject(id) });

  if (isLoading) return <div><PageHeader title="Project" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  if (error || !data?.project) return <div><PageHeader title="Project" /><div className="p-8"><EmptyState title="Project not found" /></div></div>;

  const p = data.project;
  return (
    <div>
      <PageHeader title={p.name} description={p.code} />
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex gap-2 flex-wrap">
          <Badge className={cn(statusColor(p.status))}>{p.status}</Badge>
          {p.priority ? <Badge variant="outline">{p.priority}</Badge> : null}
        </div>
        {p.description ? <p className="text-sm text-muted-foreground">{p.description}</p> : null}
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="rounded-lg border p-4"><p className="text-muted-foreground">Progress</p><p className="text-xl font-bold">{p.rolloutProgressPct ?? '—'}%</p></div>
          <div className="rounded-lg border p-4"><p className="text-muted-foreground">Sites completed</p><p className="text-xl font-bold">{p.sitesCompleted ?? '—'}</p></div>
          <div className="rounded-lg border p-4"><p className="text-muted-foreground">Delivery model</p><p className="text-xl font-bold">{p.deliveryModel.replace(/_/g, ' ')}</p></div>
        </div>
        {p.rolloutPhases?.length ? (
          <div>
            <h2 className="font-semibold mb-3">Milestones</h2>
            <div className="space-y-2">
              {p.rolloutPhases.map((phase) => (
                <div key={phase.phaseId} className="flex justify-between rounded border px-4 py-2 text-sm">
                  <span>{phase.name}</span>
                  <Badge className={cn(statusColor(phase.status))}>{phase.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">Last updated {formatDate(p.updatedAt)}</p>
      </div>
    </div>
  );
}
