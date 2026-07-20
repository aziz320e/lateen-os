'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchDecisions } from '@/lib/api/client';
import { cn, formatDate, formatPercent, statusColor } from '@/lib/utils';

export default function DecisionsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['decisions'], queryFn: fetchDecisions });

  if (isLoading || !data) {
    return <div><Header title="Decision Center" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  const pending = data.decisions.filter((d) => d.status === 'pending' || d.status === 'waiting');
  const approved = data.decisions.filter((d) => d.status === 'approved');
  const rejected = data.decisions.filter((d) => d.status === 'rejected');

  const DecisionTable = ({ rows }: { rows: typeof data.decisions }) => (
    <table className="w-full text-sm">
      <thead className="bg-muted/50">
        <tr>
          <th className="px-4 py-3 text-left">Title</th>
          <th className="px-4 py-3 text-left">Status</th>
          <th className="px-4 py-3 text-left">Confidence</th>
          <th className="px-4 py-3 text-left">Risk</th>
          <th className="px-4 py-3 text-left">Policy</th>
          <th className="px-4 py-3 text-left">Updated</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((d) => (
          <tr key={d.id} className="border-t">
            <td className="px-4 py-3">{d.title}</td>
            <td className="px-4 py-3"><Badge className={cn(statusColor(d.status))}>{d.status}</Badge></td>
            <td className="px-4 py-3">{formatPercent(d.confidence)}</td>
            <td className="px-4 py-3"><Badge className={cn(statusColor(d.risk))}>{d.risk}</Badge></td>
            <td className="px-4 py-3 text-muted-foreground">{d.policy ?? '—'}</td>
            <td className="px-4 py-3 text-muted-foreground">{formatDate(d.updatedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div>
      <Header title="Decision Center" description="Pending, approved, and rejected decisions with risk and policy context" />
      <div className="p-8 space-y-6">
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
            <TabsTrigger value="policies">Policies ({data.policies.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="rounded-lg border overflow-hidden mt-4"><DecisionTable rows={pending} /></TabsContent>
          <TabsContent value="approved" className="rounded-lg border overflow-hidden mt-4"><DecisionTable rows={approved} /></TabsContent>
          <TabsContent value="rejected" className="rounded-lg border overflow-hidden mt-4"><DecisionTable rows={rejected} /></TabsContent>
          <TabsContent value="policies" className="mt-4">
            <div className="rounded-lg border p-4 space-y-2">
              {data.policies.length === 0 ? (
                <p className="text-muted-foreground">No policies configured in Business DNA</p>
              ) : (
                data.policies.map((p, i) => (
                  <div key={String(p.id ?? i)} className="border-b border-border/50 pb-2 text-sm">
                    {String(p.name ?? p.title ?? `Policy ${i + 1}`)}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
