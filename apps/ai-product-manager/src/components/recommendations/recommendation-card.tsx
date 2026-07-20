'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { submitDecision } from '@/lib/api/client';
import { cn, formatCurrency, formatPercent, statusColor } from '@/lib/utils';
import type { DiscoveryRecommendation } from '@/types';

export function RecommendationCard({ recommendation }: { recommendation: DiscoveryRecommendation }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (action: 'approve' | 'reject') => submitDecision(recommendation.id, action),
    onSuccess: () => void queryClient.invalidateQueries(),
  });

  const candidate = recommendation.recommendationCandidate;
  const profit = recommendation.profitEstimate;
  const match = recommendation.capabilityMatch;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{candidate.title}</CardTitle>
            <CardDescription className="mt-1">{candidate.summary}</CardDescription>
          </div>
          <Badge className={cn(statusColor(recommendation.status))}>{recommendation.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Confidence" value={formatPercent(candidate.score)} />
          <Metric label="Match Score" value={formatPercent(match.overallMatchScore)} />
          <Metric
            label="Est. Monthly Profit"
            value={formatCurrency(profit.projectedMonthlyProfit, profit.currency)}
          />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AI Reasoning</p>
          <p className="mt-1 text-sm">{recommendation.rationale}</p>
          {candidate.reasons?.map((reason) => (
            <p key={reason.code} className="mt-1 text-xs text-muted-foreground">
              {reason.code}: {reason.summary}
            </p>
          ))}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Required Capabilities</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {match.matchedCapabilities.map((cap) => (
              <Badge key={cap.capabilityId} className="bg-secondary text-secondary-foreground">
                {cap.label} ({formatPercent(cap.matchScore)})
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proposed Action</p>
          <p className="mt-1 text-sm">{candidate.proposedAction}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => mutation.mutate('approve')}
            disabled={mutation.isPending || recommendation.status === 'approved'}
          >
            <Check className="h-4 w-4" />
            Approve for Decision
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => mutation.mutate('reject')}
            disabled={mutation.isPending || recommendation.status === 'rejected'}
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
