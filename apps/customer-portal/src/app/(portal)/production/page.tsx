'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/portal-shell';
import { Badge } from '@/components/ui/badge';
import { Skeleton, EmptyState } from '@/components/ui/state';
import { fetchProduction } from '@/lib/api/client';
import { cn, statusColor } from '@/lib/utils';

export default function ProductionPage() {
  const { data, isLoading } = useQuery({ queryKey: ['production'], queryFn: fetchProduction });

  return (
    <div>
      <PageHeader title="Production" description="Manufacturing stages and quality checkpoints" />
      <div className="p-6 md:p-8 space-y-6">
        {isLoading ? <Skeleton className="h-64" /> : !data?.production.length ? (
          <EmptyState title="No active production" />
        ) : (
          data.production.map((item) => (
            <div key={item.orderId} className="rounded-lg border p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Order {item.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">Current: {item.currentStage} · Machine: {item.machineStatus}</p>
                </div>
                <Badge variant="outline">ETA {item.estimatedCompletion}</Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                {item.stages.map((s) => (
                  <Badge key={s.name} className={cn(statusColor(s.status))}>{s.name}</Badge>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Quality checkpoints</p>
                {item.qualityCheckpoints.map((c) => (
                  <div key={c.name} className="text-sm flex justify-between py-1">
                    <span>{c.name}</span>
                    <span className={c.passed ? 'text-emerald-600' : 'text-muted-foreground'}>{c.passed ? 'Passed' : 'Pending'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
