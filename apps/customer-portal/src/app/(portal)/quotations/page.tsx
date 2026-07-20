'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/portal-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton, EmptyState } from '@/components/ui/state';
import { approveQuotation, fetchQuotations } from '@/lib/api/client';
import { cn, formatCurrency, statusColor } from '@/lib/utils';

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['quotations'], queryFn: fetchQuotations });
  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => approveQuotation(id, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotations'] }),
  });

  return (
    <div>
      <PageHeader title="Quotations" description="Review and approve quotations" />
      <div className="p-6 md:p-8 space-y-4">
        {isLoading ? <Skeleton className="h-64" /> : !data?.quotations.length ? (
          <EmptyState title="No quotations" />
        ) : (
          data.quotations.map((q) => (
            <div key={q.id} className="rounded-lg border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-medium">{q.number}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(q.total, q.currency)} · Valid until {q.validUntil ?? '—'}</p>
                <Badge className={cn(statusColor(q.status), 'mt-2')}>{q.status}</Badge>
              </div>
              {q.status === 'sent' ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => mutation.mutate({ id: q.id, action: 'approve' })} disabled={mutation.isPending}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: q.id, action: 'reject' })} disabled={mutation.isPending}>Reject</Button>
                  <Button size="sm" variant="ghost">Download PDF</Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost">Download PDF</Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
