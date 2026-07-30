import { Receipt } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { finance } from '@/lib/platform';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await finance.getInvoice(id);

  if (!invoice) {
    return (
      <div>
        <PageHeader title="Invoice not found" />
        <EmptyState
          icon={Receipt}
          title="No invoice with this id"
          description="It may have been removed, or the id in the URL is incorrect."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/finance">Back to Finance</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber ?? invoice.id}
        description={`Status: ${invoice.status}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/finance">Back to Finance</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>
                {invoice.subtotal} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>
                {invoice.taxTotal} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span>
                {invoice.total} {invoice.currency}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline">{invoice.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span>
                {invoice.amountPaid} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance Due</span>
              <span>
                {invoice.balanceDue} {invoice.currency}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
