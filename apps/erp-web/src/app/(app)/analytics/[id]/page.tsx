import { BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { analytics } from '@/lib/platform';

export default async function DashboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dashboard = await analytics.getDashboard(id);

  if (!dashboard) {
    return (
      <div>
        <PageHeader title="Dashboard not found" />
        <EmptyState
          icon={BarChart3}
          title="No dashboard with this id"
          description="It may have been removed, or the id in the URL is incorrect."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/analytics">Back to Analytics</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={dashboard.name}
        description={`Type: ${dashboard.dashboardType}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/analytics">Back to Analytics</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Widgets</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.widgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This dashboard has no widgets configured.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dashboard.widgets.map((widget) => (
                <li
                  key={widget.id}
                  className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                >
                  <span>{widget.label}</span>
                  {widget.kpiType ? <Badge variant="outline">{widget.kpiType}</Badge> : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
