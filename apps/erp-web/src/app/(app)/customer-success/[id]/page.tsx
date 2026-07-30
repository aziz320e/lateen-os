import { HeartHandshake } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { customerSuccess } from '@/lib/platform';

export default async function CustomerSuccessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await customerSuccess.getCustomerSuccessRecord(id);

  if (!record) {
    return (
      <div>
        <PageHeader title="Record not found" />
        <EmptyState
          icon={HeartHandshake}
          title="No customer success record with this id"
          description="It may have been removed, or the id in the URL is incorrect."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/customer-success">Back to Customer Success</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Record ${record.id}`}
        description={`Customer: ${record.customerId}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/customer-success">Back to Customer Success</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline">{record.status}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Owner</span>
            <span>{record.ownerId ?? '—'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
