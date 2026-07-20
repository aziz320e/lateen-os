'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/portal-shell';
import { Badge } from '@/components/ui/badge';
import { Skeleton, EmptyState } from '@/components/ui/state';
import { fetchApprovals } from '@/lib/api/client';
import { cn, formatDate, statusColor } from '@/lib/utils';

export default function ApprovalsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['approvals'], queryFn: fetchApprovals });

  return (
    <div>
      <PageHeader title="Approvals" description="Pending approvals and decision history" />
      <div className="p-6 md:p-8 space-y-4">
        {isLoading ? <Skeleton className="h-64" /> : !data?.approvals.length ? (
          <EmptyState title="No approvals" />
        ) : (
          data.approvals.map((a) => (
            <div key={a.id} className="rounded-lg border p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.type} · {formatDate(a.submittedAt)}</p>
                </div>
                <Badge className={cn(statusColor(a.status))}>{a.status}</Badge>
              </div>
              {a.comments ? <p className="text-sm text-muted-foreground mt-2">{a.comments}</p> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
