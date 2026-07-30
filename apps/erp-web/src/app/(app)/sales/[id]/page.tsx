import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { sales } from '@/lib/platform';

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await sales.getOpportunity(id);

  if (!opportunity) {
    return (
      <div>
        <PageHeader title="Opportunity not found" />
        <EmptyState
          icon={TrendingUp}
          title="No opportunity with this id"
          description="It may have been removed, or the id in the URL is incorrect."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/sales">Back to Sales</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={opportunity.name}
        description={`Stage: ${opportunity.stage}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/sales">Back to Sales</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stage</span>
              <Badge variant="outline">{opportunity.stage}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={opportunity.status === 'active' ? 'success' : 'outline'}>
                {opportunity.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span>{opportunity.amount ?? '—'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
