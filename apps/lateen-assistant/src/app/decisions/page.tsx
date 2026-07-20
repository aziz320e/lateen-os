'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDecisionsViaChat } from '@/lib/api/client';
import { statusColor } from '@/lib/utils';

export default function DecisionsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['decisions'], queryFn: fetchDecisionsViaChat });

  if (isLoading) return <Skeleton className="h-64 m-6" />;

  const table = data?.table;
  const rows = (table?.rows ?? []) as string[][];

  const pending = rows.filter((r: string[]) => r[1] === 'pending' || r[1] === 'submitted');
  const approved = rows.filter((r: string[]) => r[1] === 'approved');
  const rejected = rows.filter((r: string[]) => r[1] === 'rejected');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Decision Explorer</h1>
        <p className="text-sm text-muted-foreground">Decisions from AI Product Manager and Discovery pipeline</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-base">Pending</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{pending.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Approved</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-emerald-400">{approved.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Rejected</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-red-400">{rejected.length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Decisions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No decisions found</p>
          ) : (
            rows.map((row: string[], i: number) => (
              <div key={i} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span className="font-medium">{row[0]}</span>
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground">Confidence: {row[2]}</span>
                  <Badge className={statusColor(row[1] ?? 'pending')}>{row[1] ?? 'pending'}</Badge>
                  <Badge variant="outline">Risk: {row[3]}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
