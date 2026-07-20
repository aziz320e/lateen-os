'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchDecisions } from '@/lib/api/client';
import { cn, formatDate, formatPercent, statusColor } from '@/lib/utils';

export default function DecisionsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['decisions'],
    queryFn: fetchDecisions,
  });

  const groups = {
    pending: data?.filter((d) => d.status === 'pending') ?? [],
    waiting: data?.filter((d) => d.status === 'waiting') ?? [],
    approved: data?.filter((d) => d.status === 'approved') ?? [],
    rejected: data?.filter((d) => d.status === 'rejected') ?? [],
  };

  return (
    <div>
      <Header title="Decision Status" description="Recommendations submitted to the Decision Engine" />
      <div className="p-8">
        {isLoading ? <Skeleton className="h-40" /> : null}
        {error ? <p className="text-destructive">{(error as Error).message}</p> : null}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({groups.pending.length})</TabsTrigger>
            <TabsTrigger value="waiting">Waiting ({groups.waiting.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({groups.approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({groups.rejected.length})</TabsTrigger>
          </TabsList>
          {(['pending', 'waiting', 'approved', 'rejected'] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="grid gap-4 md:grid-cols-2">
              {groups[tab].map((decision) => (
                <Card key={decision.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{decision.title}</CardTitle>
                      <Badge className={cn(statusColor(decision.status))}>{decision.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>Confidence: {formatPercent(decision.confidence)}</p>
                    <p>Risk: {decision.risk}</p>
                    <p className="text-muted-foreground">Updated {formatDate(decision.updatedAt)}</p>
                  </CardContent>
                </Card>
              ))}
              {!groups[tab].length ? (
                <p className="text-muted-foreground">No {tab} decisions.</p>
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
