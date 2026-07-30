import { Users } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { crm } from '@/lib/platform';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await crm.getCustomer(id);

  if (!customer) {
    return (
      <div>
        <PageHeader title="Customer not found" />
        <EmptyState
          icon={Users}
          title="No customer with this id"
          description="It may have been removed, or the id in the URL is incorrect."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/crm">Back to CRM</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={customer.company ?? 'No company on file'}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/crm">Back to CRM</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{customer.email ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{customer.phone ?? '—'}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={customer.status === 'active' ? 'success' : 'outline'}>
                {customer.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Tags</span>
              <span>{customer.tags.length > 0 ? customer.tags.join(', ') : '—'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
