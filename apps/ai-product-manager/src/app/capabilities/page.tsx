'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDiscoveryRuns } from '@/lib/api/client';
import { cn, formatPercent, statusColor } from '@/lib/utils';

export default function CapabilitiesPage() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ['discovery-runs'],
    queryFn: fetchDiscoveryRuns,
  });

  const matches = runs?.flatMap((run) =>
    (run.capabilityMatching?.matches ?? []).map((match) => ({
      ...match,
      runId: run.id,
      opportunity: run.rank?.opportunities.find((o) => o.opportunityId === match.opportunityId)?.title,
    })),
  ) ?? [];

  return (
    <div>
      <Header title="Capability Matches" description="Manufacturing capability alignment for opportunities" />
      <div className="grid gap-4 p-8 md:grid-cols-2">
        {isLoading ? <Skeleton className="h-48" /> : null}
        {matches.map((match) => (
          <Card key={match.matchId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{match.opportunity ?? 'Opportunity'}</CardTitle>
                <Badge className={cn(statusColor(match.status))}>{match.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Overall match: {formatPercent(match.overallMatchScore)}</p>
              <p>Manufacturable: {match.manufacturable ? 'Yes' : 'No'}</p>
              <div className="flex flex-wrap gap-2">
                {match.matchedCapabilities.map((cap) => (
                  <Badge key={cap.capabilityId} className="bg-secondary">
                    {cap.label} ({formatPercent(cap.matchScore)})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && !matches.length ? (
          <p className="text-muted-foreground">No capability matches yet.</p>
        ) : null}
      </div>
    </div>
  );
}
